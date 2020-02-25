/**
 * Fix empty strings in the object (in place)
 * @param {*} obj
 */
export function fixEmptyStrings(obj) {
  for (var k in obj) {
    const objtype = typeof obj[k];
    if (objtype === 'object' && obj[k] !== null) fixEmptyStrings(obj[k]);
    else if (objtype === 'string') {
      if (obj[k] === '') {
        obj[k] = ' ';
      }
    }
  }
}
