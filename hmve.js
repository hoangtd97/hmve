'use strict';

const _                 = require('lodash');
const _is               = require('./util/is');

module.exports                     = handleMongooseValidateError;
module.exports.validate            = validateDocument;

module.exports.setOptions          = setOptions;
module.exports.setErrorContexts    = setErrorContexts;
module.exports.setMessageTemplates = setMessageTemplates;
module.exports.setTypeNames        = setTypeNames;
module.exports.setPathNames        = setPathNames;

module.exports.getOptions          = getOptions;
module.exports.getErrorContexts    = getErrorContexts;
module.exports.getMessageTemplates = getMessageTemplates;
module.exports.getTypeNames        = getTypeNames;
module.exports.getPathNames        = getPathNames;

const MSG_TEMPLATES = {}; // <pack>        : { <error_kind> : <message_template> }
const ERR_CONTEXTS  = {}; // <error_kind>  : { <field> : <value> }
const TYPE_NAMES    = {}; // <pack>        : { <type> : <type_name> }
const PATH_NAMES    = {}; // <model>       : { <pack> : { <path> : <name> } }
const OPTIONS       = {};

//------------------- SETTER ---------------------
function setMessageTemplates(packageName, messageTemplate) {
  if (!_is.filledString(packageName)) {
    throw new TypeError(`Param 'packageName' expect a string, but received '${packageName}'`);
  }
  if (!_is.filledObject(messageTemplate)) {
    throw new TypeError(`Param 'messageTemplate' expect a object, but received '${messageTemplate}'`);
  }
  MSG_TEMPLATES[packageName] = messageTemplate;
}

function setErrorContexts(errorKind, context) {
  if (arguments.length === 1) {
    context = arguments[0];

    if (!_is.filledObject(context)) {
      throw new TypeError(`Param 'context' expect a object, but received '${context}'`);
    }

    _.merge(ERR_CONTEXTS, context);
  }

  else {
    if (!_is.filledString(errorKind)) {
      throw new TypeError(`Param 'errorKind' expect a string, but received '${errorKind}'`);
    }
    if (!_is.filledObject(context)) {
      throw new TypeError(`Param 'context' expect a object, but received '${context}'`);
    }

    ERR_CONTEXTS[errorKind] = context;
  }
}

function setTypeNames(packageName, typeNames) {
  if (!_is.filledString(packageName)) {
    throw new TypeError(`Param 'packageName' expect a string, but received '${packageName}'`);
  }
  if (!_is.filledObject(typeNames)) {
    throw new TypeError(`Param 'typeNames' expect a object, but received '${typeNames}'`);
  }
  TYPE_NAMES[packageName] = typeNames;
}

function setPathNames(model, packageName, pathNames) {
  let model_name = undefined;
  if (_is.filledString(model)) {
    model_name = model;
  }
  if (_.isObject(model)) {
    model_name = model.modelName;
  }
  if (!_is.filledString(model_name)) {
    throw new TypeError(`Param 'model' expect a string or object, but received '${model}'`);
  }
  if (!_is.filledString(packageName)) {
    throw new TypeError(`Param 'packageName' expect a string, but received '${packageName}'`);
  }
  if (!_is.filledObject(pathNames)) {
    throw new TypeError(`Param 'pathNames' expect a object, but received '${pathNames}'`);
  }
  _.set(PATH_NAMES, [model_name, packageName], pathNames);
}

function setOptions(options) {
  if (!_is.filledObject(options)) {
    throw new TypeError(`Param 'options' expect a object, but received '${options}'`);
  }
  _.merge(OPTIONS, options);
}
//------------------- GETTER ----------------------
function getMessageTemplates(packageName) {
  if (_is.filledString(packageName)) {
    return _.cloneDeep(MSG_TEMPLATES[packageName]);
  }
  return _.cloneDeep(MSG_TEMPLATES);
}

function getErrorContexts(errorKind) {
  if (_is.filledString(errorKind)) {
    return _.cloneDeep(ERR_CONTEXTS[errorKind]);
  }
  return _.cloneDeep(ERR_CONTEXTS);
}

function getTypeNames(packageName) {
  if (_is.filledString(packageName)) {
    return _.cloneDeep(TYPE_NAMES[packageName]);
  }
  return _.cloneDeep(TYPE_NAMES);
}

function getPathNames(model, packageName) {
  let PathNames = undefined;
  let model_name = undefined;
  if (_is.filledString(model)) {
    model_name = model;
  }
  if (_.isObject(model)) {
    model_name = _.get(model, 'name', model_name);
  }
  if (model_name) {
    PathNames = PATH_NAMES[model_name];
    if (_is.filledString(packageName)) {
      PathNames = PathNames[packageName];
    }
  }
  return _.cloneDeep(PathNames);
}

function getOptions() {
  return _.cloneDeep(OPTIONS);
}

//------------------- EXECUTOR -------------------
function handleMongooseValidateError(model, validationError, pack) {
  [model, validationError, pack] = parseArguments(model, validationError, pack);
  const new_errors = [];

  if (_.isObjectLike(validationError.errors)) {
    for (let path in validationError.errors) {
      let line_error            = validationError.errors[path];
      const new_line_error      = generateLineError(model, line_error, pack);
      new_errors.push(new_line_error);
    }
  }

  let messages   = new_errors.map(new_error => new_error.message);
  let message    = messages.join(OPTIONS.msg_delimiter);

  let error      = new Error(message);
  error.message  = message;
  error.errors   = new_errors;
  error.messages = messages;

  if (OPTIONS.link_to_origin_error) {
    error[OPTIONS.link_to_origin_error] = validationError;
  }

  return error;
}

async function validateDocument(doc, pack) {
  const model = Object.getPrototypeOf(doc);
  if (typeof doc !== 'object' || !isMongooseModel(model)) {
    throw new TypeError(`Param 'doc' expect a mongoose document, but received '${doc}'`);
  }

  return new Promise((resolve) => {
    doc.validate(err => {
      if (!err) {
        return resolve();
      }
      
      let new_error = handleMongooseValidateError(model, err, pack);
      resolve(new_error);
    });
  });
}

function parseArguments(...args) {
  let [model, validationError, pack] = args;
  if (!isMongooseModel(model)) {
    throw new TypeError(`Parameter 'model' expect a mongoose model, but received '${model}'`);
  }
  if (typeof validationError !== 'object' || validationError.name !== "ValidationError") {
    throw validationError;
  }
  if (!_is.filledString(pack)) {
    pack = OPTIONS.default_package;
  }
  return [model, validationError, pack];
}

function isMongooseModel(val) {
  if (!_.isObject(val) || typeof val.schema !== 'object') {
    return false;
  }
  let model_name = val.name;
  if (!_is.filledString(model_name)) {
    model_name = _.get(val, 'collection.name');
    val.name = model_name;
  };
  if (!model_name) {
    return false;
  }
  return true;
}

function generateLineError(model, line_error, pack) {
  let err_context  = generateErrMsgContext(model, line_error, pack);
  let msg_template = _.get(MSG_TEMPLATES[pack], OPTIONS.default_key);
  msg_template     = _.get(MSG_TEMPLATES[pack], line_error.kind, msg_template);
  return {
    message : compile(msg_template, err_context),
    context : err_context
  }
}

function generateErrMsgContext(model, err, pack) {
  if (err.name === 'CastError') {
    let type = err.kind;
    err.kind = 'type';
    err.type = type;
    err.type_name = type;
    err.type_name = _.get(TYPE_NAMES, [pack, type].join('.'), err.type_name);
  }

  if (err.kind === 'enum') {
    let enumValues = _.get(err.properties, 'enumValues', []);
    _.set(err, 'properties.enumValuesString', enumValues.join(', '));
  }

  const schema        = model.schema;
  let base_context    = _.cloneDeep(ERR_CONTEXTS.base);
  for (let key in base_context) {
    base_context[key] = _.get(err, base_context[key]);
  }
  let kind_context    = _.cloneDeep(ERR_CONTEXTS[err.kind]);
  for (let key in kind_context) {
    kind_context[key] = _.get(err, kind_context[key]);
  }
  let context         = _.merge(base_context, kind_context);
  // name
  context.path_name   = context.path;
  context.path_name   = _.get(schema.obj, [context.path, OPTIONS.path_name_key].join('.'), context.path_name);
  context.path_name   = _.get(PATH_NAMES, [model.name, pack, context.path].join('.'), context.path_name);
  // additional context
  _.forEach(OPTIONS.additional_context_fields, (context_field, schema_field) => {
      context[context_field] = _.get(schema.obj, [context.path, schema_field].join('.'));
  });
  return context;
}

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

function isLowerCase(char) {
  return char >= 'a' && char <= 'z';
}