'use strict';

const _   = require('lodash');
const _is = require('./is');

module.exports = {
  compile   : compile,
  deCompile : deCompile
};

function compile(template,  data) {
  let result = template.toString ? template.toString() : '';
  result = result.replace(/{.+?}/g, function(matcher){
    var path = matcher.slice(1, -1).trim();
    return _.get(data, path, '');
  });
  if (result.length > 0) {
    if (isLowerCase(result[0])) {
      result = result[0].toUpperCase() + result.slice(1);
    }
  }
  return result;
}

/*
template = 'E11000 duplicate key error collection: {COLLECTION} index: {INDEX} dup key: { : {VALUE} }';
str      = 'E11000 duplicate key error collection: test.Users index: id_1 dup key: { : 1000 }';
data_keys = ['COLLECTION', 'INDEX', 'VALUE'];
data_values = ['test.Users', 'id_1', '1000'];
*/
function deCompile(template, str) {
  let data   = {};
  let keys   = [];
  let values = [];
  let flag   = '~$~';

  template = template.replace(/{([^\s}]+)}/g, (match) => {
    var key = match.slice(1, -1).trim();
    keys.push(key);
    return flag;
  });

  let fixed_elements = template.split(flag);
  fixed_elements = fixed_elements.filter(elem => elem !== '');

  for (let i in fixed_elements) {
    let fixed_elem = fixed_elements[i];
    str = str.replace(fixed_elem, flag);
  }
  values = str.split(flag);

  if (values.length > keys.length && values[0] === '') {
    values.shift();
  }
  if (values.length > keys.length && values[values.length -1] === '') {
    values.pop();
  }

  for (let i in keys) {
    data[keys[i]] = values[i];
  }

  return data;
}


function isLowerCase(char) {
  return char >= 'a' && char <= 'z';
}