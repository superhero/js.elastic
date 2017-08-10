const log = require('@superhero/debug')({debug:true});
module.exports = (tasks, cb) =>
{
  if(!Array.isArray(tasks))
    return log('provided task list MUST be an array');

  if(cb &&  typeof cb != 'function')
    return log('the callback has to be of type: "function" or "undefined"');

  (function loop(i, args)
  {
    if(i >= tasks.length)
      cb && cb(...args);

    else if(typeof tasks[i] != 'function')
      throw('all tasks MUST be of type: "function"');

    else
      tasks[i](...args, (...args) => setImmediate(() => loop(i+1, args)));
  })(0, []);
};
