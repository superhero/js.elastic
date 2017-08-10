const
request = new require('@superhero/request'),
flow    = require('@superhero/flow'),
compare = require('./lib/compare'),
okstatus = require('./lib/okstatus');

module.exports =
{
  datatype : {
    //Strings
    string : 'string',
    text : 'text',
    keyword : 'keyword',
    //Numeric
    long : 'long',
    integer : 'integer',
    short : 'short',
    byte : 'byte',
    double : 'dobule',
    float : 'float',
    half_float : 'half_float',
    scaled_float : 'scaled_float',
    //Dates
    date : 'date',
    //Bolean
    boolean : 'boolean',
    //Binary
    binary : 'binary',
    //Range
    integer_range : 'integer_range',
    float_range : 'float_range',
    long_range : 'long_range',
    double_range : 'double_range',
    date_range : 'date_range',
    //Complex
    'array' : 'array',
    'object' : 'object',
    nested : 'nested', //Array of objects
    //Geo
    geo_point : 'geo_point',
    geo_shape : 'geo_shape',
    //Special
    ip : 'ip',
    completion : 'completion',
    token_count : 'token_count',
    murmur3 : 'murmur3',
    attachment : 'attachment',
    precolator : 'precolator'
  },
  db    : (connection) => {
    var url = (connection.ssl ? 'https' : 'http') + '://'
      + (connection.user
        ? connection.user + (connection.password ? '@' + connection.password : '')
        : '')
      + connection.host
      + (connection.port ? ':' + connection.port : '');
    //host, port, user, password, ssl
    filter  = (method, options, ...args) =>
    {
      options.url = url + JSON.parse(JSON.stringify(options)).url;
      if(options.data)
        options.data = JSON.stringify(options.data);
      request[method](options, ...args);
    };
    recreate_index = (index_name, schema, cb) => {
      const
      tmp_index_name = 'tmp_' + index_name,
      headers = { 'content-type' : 'application/json' };
      //Check if temp index exists already
      flow.waterfall(
        [
          //Check temp index
          (cb) => {
            db.get({url : `/_mapping?pretty=true&index=${tmp_index_name}`, headers}, (error, result) => {
              if(error || !okstatus(result.status))
               cb(error || `Temp Index: ${tmp_index_name}, exists. Stopping...`)
              else  cb();
            });
          },
          //Create temp index
          (cb) => {
            db.put({url : `/${tmp_index_name}`, headers, data : { mappings : schema }}, (error, result) => {
              if(error || !okstatus(result.status))
                cb(error || `Error creating temp schema:\n${JSON.stringify(result, null, 2)}`);
              else
                cb();
            });
          },
          //Reindex from index to tmp_index
          (cb) => {
            face.post(
              {
                url : '/_reindex?refresh=true',
                headers,
                data : {
                  source : {
                    index : index_name
                  },
                  dest : {
                    index : tmp_index_name
                  }
                }
              },
              (error, result) => {
                if(error || !okstatus(result.status))
                  cb(error || `Error reindexing to temp index: ${index_name} -> ${tmp_index_name}\n${JSON.stringify(result, null, 2)}`);
                else {
                  cb();
                }
              }
            );
          },
          //Delete original index
          (cb) => {
            db.delete({url : `/${index_name}`, headers}, (error, result) => {
              if(error || !okstatus(result.status))
                cb(error || `Error deleting orignal index: ${index_name}\n${JSON.stringify(result, null, true)}`);
              else
                cb();
            });
          },
          //Create new index
          (cb) => {
            db.put({url : `/${index_name}`, headers, data : { mappings : schema }}, (error, result) => {
              if(error || !okstatus(result.status))
                cb(error || `Error creating new schema:\n${JSON.stringify(result, null, 2)}`);
              else cb();
            });
          },
          //Reindex from tmp_index to index
          (cb) => {
            face.post(
              {
                url : '/_reindex?refresh=true',
                headers,
                data : {
                  source : {
                    index : tmp_index_name
                  },
                  dest : {
                    index : index_name
                  }
                }
              },
              (error, result) => {
                if(error || !okstatus(result.status))
                  cb(error || `Error reindexing to orignal index: ${tmp_index_name} -> ${index_name}\n${JSON.stringify(result, null, 2)}`);
                else cb();
              }
            );
          },
          //Delete tmp index
          (cb) => {
            db.delete({url : `/${tmp_index_name}?pretty=true`, headers}, (error, result) => {
              if(error || !okstatus(result.status))
                cb(error || `Error deleting temp index: ${tmp_index_name}\n${JSON.stringify(result, null, 2)}`);
              else cb(null);
            });
          },
        ],
        (error, result) => {
          if(error)
            console.log("Error reindexing: ");
          else
            console.log("Reindex succes");
          cb(error);
        }
      );//Watefall call
    };
    face = {
      get   : (...args) => filter('get',     ...args),
      put   : (...args) => filter('put',     ...args),
      post  : (...args) => filter('post',    ...args),
      delete: (...args) => filter('delete',  ...args),
      /* index(index_name, schema, update, cb)
      index_name: string -> name_of_an_index
      schema: object -> new schema for that index, { type : { properties { prop1 { type: elastic.datatype}}}})
      update: boolean -> if true and given schema and db schema doesnt match,
        will create a temporal copy of the index with the given schema,
        add the data to the temp index
        delete THE ENTIRE given index
        create the index again with the given schema,
        move the data back to the new index with the given name
        copping the data
      cb: function -> callback function */
      index : (index_name, schema, update, cb) => {
        //We ask fro the mapping schema
        face.get({ url : `/${index_name}/_mapping?pretty=true`}, (error, result) =>
        {
          if(error)
          {
            cb(error);
            return;
          }
          //Check if update param is true and does the proper call
          const recreate = () => {
            if(update) {
              console.log("Schemas differ. Recreating index");
              recreate_index(index_name, schema, cb);
            } else {
              cb(false, 'Schemas differ. No action done');
            }
          }
          if(!index_name in result.data)
          {
            console.log(`${index_name} not present in db`, JSON.stringify(result.data, null, 2));
            recreate();
          }
          else
          {
            //we must compare base obj of the index with the schema
            let
            a = schema,
            b = result.data[index_name].mappings;
            if(!compare(a, b)){
              recreate();
            } else {
              console.log(`Provided schema and user schema are equals, schema untouched`);
              cb();
            }
          }
        }); //face.get schema call
      }   //index func definition
    };  //face
    return face;
  }
};
