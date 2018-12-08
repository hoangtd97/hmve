'use strict';

module.exports = {
  string       : isString,
  filledString : isFilledString,
  array        : isArray,
  filledArray  : isFilledArray,
  object       : isObject,
  filledObject : isFilledObject,
};

/////////////////////////////
function isString(val) {
  return ( typeof val === 'string' || val instanceof String );
}

/**
 * check whether val is a string,
 *  and have min length, max length match params provided
 * @param {any} val 
 * @param {number} [minLength] 
 * @param {number} [maxLength] 
 * 
 * @returns {boolean} true or false
 */
function isFilledString(val, minLength = 1, maxLength = Number.MAX_SAFE_INTEGER) {
  return (
    ( typeof val === 'string' || val instanceof String )
    && val.length >= minLength && val.length <= maxLength
    );
}

function isArray(val) {
  return Array.isArray(val);
}

function isFilledArray(val) {
  return (Array.isArray(val) && val.length > 0);
}

function isObject(val) {
  return (val !== null && typeof val === 'object');
}

/**
 * Check whether the value is an object have least one path,
 *  and [if paths provided] contain all path in paths
 * @example
 * _is.filledObject({ id : 1000 })                                => true
 * _is.filledObject('bibo')                                       => false
 * _is.filledObject({ id : 1000 }, ['id', 'name'])                => false
 * _is.filledObject({ id : 1000, name : 'bibo'}, ['id', 'name'])  => true
 * @param {any} val - value want to check
 * @param {string|string[]} [paths] - path(s) that the object must contain all
 * 
 * @returns {boolean} true or false
 */
function isFilledObject(val, paths) {
  if (val === null || typeof val !== 'object' || Object.keys(val).length < 1) {
    return false;
  }
  if (isFilledString(paths))
    paths = [paths];
  if (Array.isArray(paths) && paths.length > 0) {
    for (let i in paths) {
      if (val[paths[i]] === undefined)
        return false;
    }
  }
  return true;
}