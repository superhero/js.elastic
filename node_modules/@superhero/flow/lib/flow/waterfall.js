const log = require('@superhero/debug')();
module.exports = (tasks, cb) =>
{
  if(!Array.isArray(tasks))
    return log('provided task list MUST be an array');

  if(typeof cb != 'function')
    return log('the callback has to be of type: "function"');

  (function loop(i, args)
  {
    const error = args.shift();

    if(i >= tasks.length || error)
      return cb(error, ...args);

    else
      log(`step: ${i+1} of: ${tasks.length}`);

    if(typeof tasks[i] != 'function')
      throw('all tasks MUST be of type: "function"');

    else
      tasks[i](...args, (...args) => setImmediate(() => loop(i+1, args)));
  })(0, []);
};
