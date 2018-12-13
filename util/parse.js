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
  let index_info = template.deCompile(CONST.MONGOOSE_INDEX_TEMPLATE, err_data.index);
  _.merge(err, err_data, index_info);
}