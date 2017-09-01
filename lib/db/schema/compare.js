var toString = Object.prototype.toString;
/* -----------------------------------------------------------------------------------------
   compare( a, b] )

   Returns true if b has the same properties and values than a has, false otherwise.

   Parameters:
     - a (Any type): value to compare to b
     - b (Any type): value compared to a

   Implementation:
     result of 'a' compare 'b' is true if all scalar values in a exists in b are strictly equal as
     compared with operator '===' except for these two special cases:
       - 0 === -0 but are not equal.
       - NaN is not === to itself but is equal.

     RegExp objects are considered equal if they have the same lastIndex, i.e. both regular
     expressions have matched the same number of times.

     Functions must be identical, so that they have the same closure context.

     "undefined" is a valid value, including in Objects
*/

function compare(a, b)
{
  // a and b have already failed test for strict equality or are zero

  var s, l, p, x, y;

  // They should have the same toString() signature
  if(( s = toString.call(a)) !== toString.call(b))
    return false;

  switch(s)
  {
    default: // Boolean, Date, String
      return a.valueOf() === b.valueOf();

    case '[object Number]':
      // Converts Number instances into primitive values
      // This is required also for NaN test bellow
      a = +a;
      b = +b;

      return a
        // a is Non-zero and Non-NaN
        ? a === b
        // a is 0, -0 or NaN
        : a === a
          // a is 0 or -O
          ? 1/a === 1/b    // 1/0 !== 1/-0 because Infinity !== -Infinity
          : b !== b;       // NaN, the only Number not equal to itself!
      
    case '[object RegExp]':
      return a.source     == b.source
          && a.global     == b.global
          && a.ignoreCase == b.ignoreCase
          && a.multiline  == b.multiline
          && a.lastIndex  == b.lastIndex;

    case '[object Function]':
      return false; // functions should be strictly equal because of closure context

    case '[object Array]':
      if((l = a.length) != b.length)
        return false;

      // Both have as many elements
      while(l--)
      {
        if((x = a[l]) === (y = b[l]) && x !== 0 || compare(x, y))
          continue;

        return false;
      }
      return true;

    case '[object Object]':
      l = 0; // counter of own properties
      for(p in a)
        if(a.hasOwnProperty(p))
        {
          ++l;
          if((x = a[p]) === (y = b[p] ) && x !== 0 || compare(x, y))
            continue;

          return false;
        }

      return true;
  }
}

module.exports = (a, b) =>
     a === b         // strick equality should be enough unless zero
  && a !== 0         // because 0 === 0, requires test by compare()
  || compare(a, b);  // handles not strictly equal or zero values
