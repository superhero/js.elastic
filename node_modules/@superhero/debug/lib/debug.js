const
util    = require('util'),
colors  = ['blue','cyan','green','magenta','red','yellow'],
pad     = (pre, str) => (pre + str).substring((str+'').length),
date    = date => `${date.getFullYear()}-`
                 +`${pad('00', date.getMonth()+1)}-`
                 +`${date.getDate()} `
                 +`${pad('00', date.getHours())}:`
                 +`${pad('00', date.getMinutes())}:`
                 +`${pad('00', date.getSeconds())}`;

// color index starts from a random color
let color_i = Math.floor(Math.random() * colors.length);

module.exports = (options = {}) =>
{
  // cycles the colors to prevent duplicates
  color_i = ++color_i < colors.length ? color_i : 0;

  const
  config = Object.assign(
  {
    maxArrayLength  : 3,
    color           : colors[color_i],
    colors          : true,
    date            : true,
    debug           : true,
    depth           : 10,
    index           : true,
    prefix          : false,
    separator       : ':\t'
  }, options),
  colorize = txt => '\x1b[' + color + 'm' + txt + '\x1b[0m',
  escape   = txt => txt && txt.replace
                  ? txt.replace(/[\x00-\x09\x10-\x1F]/g, '')
                  : txt;

  let
  // auto increment index
  i = 0,
  // mapping colors
  color;
  switch (config.color)
  {
    case 'black'  : color = '30'; break;
    case 'blue'   : color = '34'; break;
    case 'cyan'   : color = '36'; break;
    case 'green'  : color = '32'; break;
    case 'magenta': color = '35'; break;
    case 'red'    : color = '31'; break;
    case 'yellow' : color = '33'; break;

    case 'white':
    default:
      color = '37';
      break;
  }

  // options used for inspection
  const inspectOptions =
  {
    depth          : config.depth,
    colors         : config.colors,
    maxArrayLength : config.maxArrayLength
  };

  // returning the logger
  return (...args) =>
  {
    if(i >= Number.MAX_SAFE_INTEGER)
      i = 0;

    config.debug
    && console.log(
      // colorizing the prefix..
      colorize(
        [ config.prefix,
          config.date   && date(new Date()),
          config.index  && ++i
        ].filter(_=>_).join(config.separator) + config.separator),
      // each object needs to be properly inspected, colorize the rest..
      ...args.map(arg =>
        typeof arg == 'object'
        ? util.inspect(arg, inspectOptions)
        : colorize(escape(arg))));
  }
};
