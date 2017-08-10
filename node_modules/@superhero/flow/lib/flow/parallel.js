module.exports = (tasks, cb) =>
{
  if(typeof tasks != 'object')
    throw `task list MUST be of type "object", "${typeof tasks}" given`;

  let
  count   = 0,
  errors  = {},
  out     = {},
  length  = Array.isArray(tasks)
          ? tasks.length
          : Object.keys(tasks).length;

  // if no tasks.. nothing todo..
  if(!length)
    return cb(null, out);

  const persist = i => (error, ...values) =>
  {
    error
    ? errors[i] = error
    : out[i]    = values;

    ++count == length && cb(Object.keys(errors).length ? errors : null, out);
  };

  // loop through the tasks
  for(let i in tasks)
    try
    {
      tasks[i](persist(i));
    }
    // catching all exceptions as errors
    catch(error)
    {
      persist(i)(error);
    };
}
