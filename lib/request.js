const request = (method, baseUrl, options, ...a) =>
{
  options.url  = baseUrl + url;
  options.data = options.data && JSON.stringify(options.data);
  require('@superhero/request')[method](options, ...a);
}

module.exports = class
{
  function constructor(baseUrl)
  {
    this.baseUrl = baseUrl;
  }

  function get(...a)
  {
    request('get', this.baseUrl, ...a);
  }

  function put(...a)
  {
    request('put', this.baseUrl, ...a);
  }

  function post(...a)
  {
    request('post', this.baseUrl, ...a);
  }

  function delete(...a)
  {
    request('delete', this.baseUrl, ...a);
  }
};
