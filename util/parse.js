'use strict';

const _        = require('lodash');
const template = require('./template');
const CONST    = require('../const');

module.exports = {
  uniqueError : parseUniqueError
};

function parseUniqueError(err) {
  err.kind = 'unique';
  let err_data = template.deCompile(CONST.MONGOOSE_UNIQUE_ERROR_TEMPLATE, err.message);

  if (err_data.value.startsWith('"') && err_data.value.endsWith('"')) {
    err_data.value = err_data.value.slice(1, -1);
  }

  let [path] = parseUniqueIndexString(err_data.index);
  _.merge(err, err_data, { path : path });
}

/**
 * Parse mongoose unique index string
 * @param {string} indexStr index string, ex : _id_, username_1
 * @return {array} [path, direct], ex : [username, 1]
 */
function parseUniqueIndexString(indexStr) {
  let path = '';
  let direct = undefined;
  if (typeof indexStr === 'string' && indexStr.length > 1) {
    let postFixLength = 1;
    let lastChar      = indexStr.charCodeAt(indexStr.length - 1);
    if (lastChar >= '0' && lastChar <= '9') {
      direct = Number(lastChar);
      postFixLength++;
    }
    path = indexStr.slice(0, -postFixLength);
  }
  return [path, direct];
}