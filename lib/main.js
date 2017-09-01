const
datatype  = require('./datatype'),
index     = require('./index'),
Request   = require('./request'),
DB        = require('./db');

module.exports =
{
  datatype,
  db : (url) =>
  {
    const
    baseUrl = typeof url == 'string' ? url : require('url').format(url),
    request = new Request(baseUrl),
    db      = new DB(request);

    return { index : db.persistSchema };
  }
};
