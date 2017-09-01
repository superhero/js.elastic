const
flow          = require('@superhero/flow'),
compareSchema = require('./db/schema/compare'),
ok            = (status) => (status & 200) == 200;

module.exports = class
{
  function constructor(request)
  {
    this.request = request;
  }

  function exsists(index, mappings, cb)
  {
    cb(index in mappings && `index "${index}" already exists, can not proceed`);
  }

  function delete(index, cb)
  {
    this.request.delete({ url : `/${index}` }, (error, dto) => cb(error || !ok(dto.status) || `error deleting index "${index}"`));
  }

  function create(index, schema, cb)
  {
    this.request.put(
    {
      url   : `/${index}`,
      data  : { mappings : schema }
    },
    (error, dto) => cb(error || !ok(dto.status) || `error creating index "${index}"`));
  }

  function reindex(source, destination, cb)
  {
    this.request.post(
    {
      url   : '/_reindex?refresh=true',
      data  :
      {
        source  : { index : source },
        dest    : { index : destination }
      }
    },
    (error, dto) => cb(error || !ok(dto.status) && `error reindexing "${source}" -> "${destination}"`));
  }

  function getMappings(index, cb)
  {
    this.request.get({ url:`/${index}/_mapping` }, (error, dto) =>
    {
      if(error)
        return cb(error);

      if(index in dto.data)
        return cb(null, dto.data[index].mappings);

      else
        return cb(null, false);
    });
  }

  function persistSchema(index, schema, cb)
  {
    this.getMappings(index, function(error, mappings)
    {
      if(error)
        return cb(error);

      if(!mappings)
        return this.create(index, schema, cb)

      if(compareSchema(schema, mappings))
        return cb();

      const index_tmp = `${index}_tmp_${Date.now().toString(36)}`;

      flow.waterfall(
      [
        // check tmp index
        (cb) => this.exists(index_tmp, mappings, cb),
        // create tmp index
        (cb) => this.create(index_tmp, schema, cb),
        // reindex from index to tmp_index
        (cb) => this.reindex(index, index_tmp, cb),
        // Delete original index
        (cb) => this.delete(index, cb),
        // create new index
        (cb) => this.create(index, schema, cb),
        // reindex from tmp_index to index
        (cb) => this.reindex(index_tmp, index, cb),
        // delete tmp index
        (cb) => this.delete(index, cb),
      ],
      (error) =>
      {
        console.log(error ? 'error reindexing' : 'reindex succes');
        cb(error);
      });
    }.bind(this));
  }
}
