//Get Connection wrapper
//to test, just run node test.js
const
flow    = require('@superhero/flow'),
elastic = require('../elasticsearch'),
compare = require('./lib/compare'),
okstatus = require('./lib/okstatus');

//User provided data
const
host = 'localhost',
port = 9200,
index_name = 'test_index'
schema = {
  test_type : {
    properties : {
      email : {
          type : elastic.datatype.keyword,
      }
    }
  }
};
//Test helping vars
const
headers = { 'content-type' : 'application/json' },
temp_index_name = 'tmp_' + index_name,
create_schema = {
  mappings : {
    test_type : {
      properties : {
        email : {
            type : 'string',
        }
      }
    }
  }
};
//console.log(JSON.stringify(create_schema, null, 2));

//Crate the connection
db = elastic.db({ host, port});
flow.waterfall(
[
  //Cleanup the enviroment
  /*Check if the index exists and delete it*/
  (cb) => {
    console.log('Setup...');
    db.get({url : `/_mapping?pretty=true&index=${index_name}`, headers}, (error, result) => {
      if(error || !okstatus(result.status))
        cb(error || `Error on setup, get index: ${index_name} \n${JSON.stringify(result, null, 2)}`);
      else if(index_name in result.data) {
        console.log('Index exists, deleting...');
        //Delete
        db.delete({url : `/${index_name}`, headers}, (error, result) => {
          if(error || !okstatus(result.status))
            cb(error || `Error on setup, delete index: ${index_name} \n${JSON.stringify(result, null, 2)}`);
          else cb();
        });
      } else cb();
    });
  },
  /*Check temp index exists and delete it */
  (cb) => {
    db.get({url : `/_mapping?pretty=true&index=${temp_index_name}`, headers}, (error, result) => {
      if(error || !okstatus(result.status))
        cb(error || `Error on setup, get temp index: ${temp_index_name} \n${JSON.stringify(result, null, 2)}`);
      else if(temp_index_name in result.data) {
        console.log('Temp index exists, deleting...');
        //Delete
        db.delete({url : `/${temp_index_name}`, headers}, (error, result) => {
          if(error || !okstatus(result.status))
            cb(error || `Error on setup, delete temp index: ${temp_index_name} \n${JSON.stringify(result, null, 2)}`);
          else cb();
        });
      } else cb();
    });
  },
  /* Create the new index as a clean test enviroment*/
  (cb) => {
    //prepare schema
    db.put({url : `/${index_name}`, headers, data : create_schema}, (error, result) => {
      if(error || !okstatus(result.status))
        cb(error || `Error on setup, create schema:\n${JSON.stringify(result, null, 2)}`);
      else cb();
    });
  },
  (cb) => {
    //add some data
    db.post({url : `/${index_name}/test_type`, headers, data : { email : 'test@name.com', roles : [] }}, (error, result) => {
      if(error || !okstatus(result.status))
        cb(error || `Error on setup, create add data:\n${JSON.stringify(result, null, 2)}`);
      else {
        console.log("ok");
        cb();
      }
    });
  },
  /* call the db.index func to test it */
  (cb) => {
    console.log("Begin index");
    db.index(index_name, schema, true, cb);
  },
  //Check result using the compare function itself ?
  (cb) => {
    console.log("Begin final validity test")
    db.get({ url : `/${index_name}/_mapping?pretty=true`}, (error, result) =>
    {
      if(error || !okstatus(result.status))
        cb(error || `Error on final test:\n${JSON.stringify(result, null, 2)}`);
      else if(!index_name in result.data)
        cb(`Error on final test, ${index_name} not present in db, test fail\n` + JSON.stringify(result, null, 2));
      else {
        let
        a = schema,
        b = result.data[index_name].mappings;
        console.log("Compare call: ");
        console.log("User schema: ");
        console.log(JSON.stringify(a, null, 2));
        console.log("DB schema: ");
        console.log(JSON.stringify(b, null, 2));
        //we must compare base obj of the index with the schema
        compare(a, b)
        ? cb('Provided schema and user schema are equals, test success')
        : cb('Provided schema and user schema are not equals, test fail');
      }
    }); //face.get schema call
  }
],
(...a) => {
  console.log('Result: ');
  if(a && a.length){
    for(let k in a)
      console.log(typeof a[k] == 'string' ? a[k] : JSON.stringify(a[k], null, 2));
  } else  console.log(typeof a[k] == 'string' ? a[k] : JSON.stringify(a, null, 2));

});
