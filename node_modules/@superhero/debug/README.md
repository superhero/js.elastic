# Debug

Licence: [MIT](https://opensource.org/licenses/MIT)

---

[![npm version](https://badge.fury.io/js/%40superhero%2Fdebug.svg)](https://badge.fury.io/js/%40superhero%2Fdebug)

A debug utility for pretty output..

## Install

`npm install @superhero/debug`

...or just set the dependency in your `package.json` file:

```json
{
  "dependencies":
  {
    "@superhero/debug": "*"
  }
}
```

## Example

```javascript
const debug = require('@superhero/debug')(/* options */);
debug('debug:', {foo:'bar', baz:'qux'});
```

## Options

All options are optional.

```javascript
{
  // cap array output
  maxArrayLength: 3,

  // define a desired color of the output:
  // [black, blue, cyan, green, magenta, red, yellow, white]
  color: undefined,

  // if false, output wont be colored.
  colors: true,

  // show timestamp in prefix.
  date: true,

  // if false, no output is made.
  debug: true,

  // depth of object inspection.
  depth: 10,

  // if an auto increment index should be printed.
  index: true,

  // a string that will prefix the output.
  prefix: false,

  // what separator to be used between prefixes and content.
  separator: ':\t'
}
```
