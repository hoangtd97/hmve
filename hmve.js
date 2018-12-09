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

const ERROR_TYPE = {
  MULTI       : 'multi',         // when validate or save
  SINGLE      : 'single',        // when update
  UNSUPPORTED : 'unsupported', 
};

//------------------- EXECUTOR -------------------

/**
 * Handle mongoose validation error
 * @function hmve
 * @param {Object} model Mongoose model object or name
 * @param {Object} validationError Mongoose validation error
 * @param {String} [pack] package name, default is options.default_package
 * 
 * @return {Object} user-friendly error
 * 
 * @example
 * const hmve = require('hmve');
 * 
 * const UsersSchema = new Schema({
 *   username : { type : String, required : true                                  },
 *   fullName : { type : String, required : false, minlength : 3, maxlength : 100 },
 *   birthday : { type : Date  , required : false                                 },
 * });
 *
 * const UsersModel = mongoose.model('Users', UsersSchema, 'Users');
 * 
 * let user = UsersModel({
 *   fullName : 'Bi',
 *   birthday : 'is a date?',
 * });
 * 
 * user.validate(err => {
 *   user_friendly_error = hmve(UsersModel, err);
 *   if (user_friendly_error) {
 *      res.status(422).json(user_friendly_error.message); 
 *   }
 * });
 * 
 * 
 * // user_friendly_error look like :
 * {
 *    "message" : "Birthday must be a date, Username is required, FullName must be at least 3 characters long",
 *    "messages": [
 *      "Birthday must be a date",
 *      "Username is required",
 *      "FullName must be at least 3 characters long"
 *    ]
 *    "model_name": "Users",
 *    "pack": "DEFAULT",
 *    "errors": [
 *      {
 *        "message": "Birthday must be a date",
 *        "context": {
 *          "KIND": "type",
 *          "PATH_NAME": "birthday",
 *          "PATH": "birthday",
 *          "TYPE": "Date",
 *          "TYPE_NAME": "date",
 *          "VALUE": "is a date?",
 *          "STRING_VALUE": "\"is a date?\""
 *        },
 *        "template": "{PATH_NAME} must be a {TYPE_NAME}"
 *      },
 *      {
 *        "message": "Username is required",
 *        "context": {
 *          "KIND": "required",
 *          "PATH_NAME": "username",
 *          "PATH": "username"
 *        },
 *        "template": "{PATH_NAME} is required"
 *      },
 *      {
 *        "message": "FullName must be at least 3 characters long",
 *        "context": {
 *          "KIND": "minlength",
 *          "PATH_NAME": "fullName",
 *          "PATH": "fullName",
 *          "VALUE": "Bi",
 *          "MIN_LENGTH": 3
 *        },
 *        "template": "{PATH_NAME} must be at least {MIN_LENGTH} characters long"
 *      }
 *    ],
 * }
 * 
 */
function handleMongooseValidateError(model, validationError, pack) {
  let error_type;
  [model, validationError, pack, error_type] = parseArguments(model, validationError, pack);
  const originError = _is.filledString(OPTIONS.link_to_origin_error) ? _.cloneDeep(validationError) : undefined;
  const new_errors = [];

  if (error_type === ERROR_TYPE.MULTI) {
    for (let path in validationError.errors) {
      let line_error            = validationError.errors[path];
      const new_line_error      = generateLineError(model, line_error, pack);
      new_errors.push(new_line_error);
    }
  }

  if (error_type === ERROR_TYPE.SINGLE) {
    let line_error            = validationError;
    const new_line_error      = generateLineError(model, line_error, pack);
    new_errors.push(new_line_error);
  }

  let messages     = new_errors.map(new_error => new_error.message);
  let message      = messages.join(OPTIONS.msg_delimiter);

  let error        = new Error(message);
  error.model_name = model.modelName;
  error.pack       = pack;
  error.errors     = new_errors;
  error.messages   = messages;

  if (originError) {
    error[OPTIONS.link_to_origin_error] = originError;
  }

  return error;
}

function parseArguments(...args) {
  let [model, validationError, pack] = args;
  if (!isMongooseModel(model)) {
    throw new TypeError(`Parameter 'model' expect a mongoose model, but received '${model}'`);
  }

  let error_type = ERROR_TYPE.UNSUPPORTED;
  if (isMultiValidationError(validationError)) {
    error_type = ERROR_TYPE.MULTI;
  }
  if (isSingleValidationError(validationError)) {
    error_type = ERROR_TYPE.SINGLE;
  }
  if (error_type === ERROR_TYPE.UNSUPPORTED) {
    throw validationError;
  }
  
  if (!_is.filledString(pack)) {
    pack = OPTIONS.default_package;
  }
  return [model, validationError, pack, error_type];
}

/**
 * Validate mongoose document, handle error with hmve
 * @function validate
 * @param {Object} doc mongoose document
 * @param {String} [pack] package name, default is options.default_package
 * 
 * @return {object} user-friendly error
 * 
 * @example
 * const hmve = require('hmve');
 * 
 * const UsersSchema = new Schema({
 *   username : { type : String, required : true                                  },
 *   fullName : { type : String, required : false, minlength : 3, maxlength : 100 },
 *   birthday : { type : Date  , required : false                                 },
 * });
 *
 * const UsersModel = mongoose.model('Users', UsersSchema, 'Users');
 * 
 * let user = UsersModel({
 *   fullName : 'Bi',
 *   birthday : 'is a date?',
 * });
 * 
 * let user_friendly_error = await hmve.validate(user);
 * if (user_friendly_error) {
 *    res.status(422).json(user_friendly_error.message); 
 * }
 */
function validateDocument(doc, pack) {
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

function isMultiValidationError(error) {
  return typeof error === 'object' 
  && error.name === "ValidationError" 
  && _is.filledObject(error.errors);
}

function isSingleValidationError(error) {
  return typeof error === 'object' 
  && _is.filledObject(error, ['name', 'path', 'kind'])
  && !_is.filledObject(error.errors);
}

function generateLineError(model, line_error, pack) {
  let err_context  = generateErrMsgContext(model, line_error, pack);
  let msg_template = _.get(MSG_TEMPLATES[pack], OPTIONS.default_key);
  msg_template     = _.get(MSG_TEMPLATES[pack], line_error.kind, msg_template);
  if (line_error.kind === 'user defined') {
    msg_template = line_error.message;
  }
  return {
    message  : compile(msg_template, err_context),
    context  : err_context,
    template : msg_template
  }
}

function generateErrMsgContext(model, err, pack) {
  const schema        = model.schema;

  if (err.name === 'CastError') {
    let type = err.kind;
    err.kind = 'type';
    err.type = type;
    err.type_name = type;
    err.type_name = _.get(TYPE_NAMES, [pack, type].join('.'), err.type_name);
  }

  if (err.kind === 'enum') {
    let enumValues = _.get(err.properties, 'enumValues', []);
    _.set(err, 'properties.stringEnumValues', enumValues.join(', '));
  }

  if (err.kind === 'user defined') {
    err.kind = 'validate';
  }

  err.path_name   = err.path;
  err.path_name   = _.get(schema.obj, [err.path, OPTIONS.path_name_key].join('.'), err.path_name);
  err.path_name   = _.get(PATH_NAMES, [model.name, pack, err.path].join('.'), err.path_name);

  let base_context    = _.cloneDeep(ERR_CONTEXTS.base);
  for (let key in base_context) {
    base_context[key] = _.get(err, base_context[key]);
  }

  let kind_context    = _.cloneDeep(ERR_CONTEXTS[err.kind]);
  for (let key in kind_context) {
    kind_context[key] = _.get(err, kind_context[key]);
  }
  
  let context         = _.merge(base_context, kind_context);

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

//------------------- SETTER ---------------------

/**
 * Set message template for a package
 * @param {String} packageName Package name, ex: 'en', 'vi', 'jp'
 * @param {Object} messageTemplate { <error_kind> : <message_template> }
 * 
 * @see getErrorContexts to view all message template variable
 * @example
 * 
 * hmve.setMessageTemplates('vi', { 
 *   DEFAULT   : '{PATH_NAME} không hợp lệ',
 *   type      : '{PATH_NAME} phải là {TYPE_NAME}',
 *   required  : 'Thiếu thông tin {PATH_NAME}',
 *   min       : '{PATH_NAME} không được nhỏ hơn {MIN}',
 *   max       : '{PATH_NAME} không được lớn hơn {MAX}',
 *   minlength : '{PATH_NAME} dài ít nhất {MIN_LENGTH} kí tự',
 *   maxlength : '{PATH_NAME} không vượt quá {MAX_LENGTH} kí tự',
 *   enum      : '{PATH_NAME} phải thuộc một trong các giá trị sau : {STRING_ENUM_VALUES}',
 *   regex     : '{PATH_NAME} không hợp lệ',
 * });
 */
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

/**
 * Set type names for a package
 * @param {String} packageName Package name, ex: 'en', 'vi', 'jp'
 * @param {Object} typeNames  { <type> : <type_name> }
 * 
 * @see getTypeNames('DEFAULT') to view default type names
 * @example
 * 
 * hmve.setTypeNames('vi', { 
 *   Number  : 'số',
 *   Boolean : 'luận lý',
 *   Date    : 'ngày',
 *   String  : 'chuỗi',
 *   Array   : 'Mảng',
 *   Object  : 'Đối tượng'
 * });
 */
function setTypeNames(packageName, typeNames) {
  if (!_is.filledString(packageName)) {
    throw new TypeError(`Param 'packageName' expect a string, but received '${packageName}'`);
  }
  if (!_is.filledObject(typeNames)) {
    throw new TypeError(`Param 'typeNames' expect a object, but received '${typeNames}'`);
  }
  TYPE_NAMES[packageName] = typeNames;
}

/**
 * Set path names for a package
 * @param {Object|String} model mongoose model or model name
 * @param {String} packageName package name, ex: 'en', 'vi'
 * @param {Object} pathNames { <path> : <path_name> }, which has the same structure as Mongoose Schema
 * 
 * @example
 * 
 * hmve.setPathNames('User', 'vi', {
 *    username : 'tên tài khoản',
 *    age      : 'tuổi',
 *    address  : {
 *      country : 'quốc gia',
 *      province : 'tỉnh thành'
 *    }
 * });
 */
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

/**
 * set options
 * @param {Object} options options
 * @example
 * 
 * hmve.setOptions({
 *    default_package           : 'DEFAULT',
 *    msg_delimiter             : ', ',
 *    path_name_key             : '$name',
 *    link_to_origin_error      : false,
 *    additional_context_fields : {
 *      // <context_key> : <schema_key>
 *    }
 * });
 */
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