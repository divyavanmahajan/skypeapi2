/**
 * Safe function to walk a path in a Javascript object. Sometimes a part of the path is missing.
 *
 * @param {*} obj Javascript object at the root of the path
 * @param {*} attributeName Name to display in error message.
 * @param {*} defaultValue Default value if value not available
 * @param {*} indexes string of indexes that are used to walk down the path
 */
function getSafeValue(
  obj,
  attributeName,
  defaultValue,
  indexString,
  messageLogger
) {
  let current = obj;
  try {
    if (obj == null) {
      throw new Error(`  Object is null for ${attributeName}.`);
    }
    const indexes = indexString
      .split(".")
      .map(e => (isNaN(parseInt(e)) ? e : parseInt(e)));
    // console.log(`${attributeName}: ${indexString} => ${JSON.stringify(indexes)}`);
    let list = [];
    for (let i = 0; i < indexes.length; i++) {
      const index = indexes[i];
      list.push(index);
      current = current[index];
      if (current === undefined) {
        // const missingPath = list.join('.');
        throw new Error(`  ${attributeName} not defined. `);
      }
    }
  } catch (e) {
    messageLogger(e.message);
  }
  if (current !== undefined) {
    return current;
  } else {
    return defaultValue;
  }
}
exports.getSafeValue = getSafeValue;
