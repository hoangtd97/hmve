'use strict';

const _        = require('lodash');
const _is      = require('./util/is');
const CONST    = require('./const');
const template = require('./util/template');

module.exports                     = handleMongooseValidateError;
module.exports.validate            = validateDocument;

module.exports.config              = config;
module.exports.setErrorContexts    = setErrorContexts;
module.exports.setMessageTemplates = setMessageTemplates;
module.exports.setTypeNames        = setTypeNames;
module.exports.setPathNames        = setPathNames;

module.exports.getConfig          = getConfig;
module.exports.getErrorContexts    = getErrorContexts;
module.exports.getMessageTemplates = getMessageTemplates;
module.exports.getTypeNames        = getTypeNames;
module.exports.getPathNames        = getPathNames;

const MSG_TEMPLATES = {}; // <pack>        : { <error_kind> : <message_template> }
const ERR_CONTEXTS  = {}; // <error_kind>  : { <field> : <value> }
const TYPE_NAMES    = {}; // <pack>        : { <type> : <type_name> }
const PATH_NAMES    = {}; // <model>       : { <pack> : { <path> : <name> } }
const CONFIG        = {};

//------------------- EXECUTOR -------------------

/**
 * Handle mongoose validation error
 * @function hmve
 * @param {Object} model Mongoose model object or name
 * @param {Object} validationError Mongoose validation error
 * @param {Object} [options]
 * 
 * @description 
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
 *      res.status(400).json(user_friendly_error.message); 
 *   }
 * });
 * 
 */
function handleMongooseValidateError(model, validationError, options) {
  let error_type;
  [model, validationError, options, error_type] = parseArguments(model, validationError, options);
  const new_errors = [];

  if (error_type === CONST.ERROR_TYPE.UNSUPPORTED) {
    return validationError;
  }

  if (error_type === CONST.ERROR_TYPE.MULTI) {
    for (let path in validationError.errors) {
      let line_error            = validationError.errors[path];
      const new_line_error      = generateLineError(model, line_error, options);
      if (_is.filledObject(new_line_error)) {
        new_errors.push(new_line_error);
      }
    }
  }

  if (error_type === CONST.ERROR_TYPE.SINGLE) {
    let line_error            = validationError;
    const new_line_error      = generateLineError(model, line_error, options);
    new_errors.push(new_line_error);
  }

  if (new_errors.length <= 0) {
    return undefined;
  }

  let messages     = new_errors.map(new_error => new_error.message);
  let message      = messages.join(CONFIG.msg_delimiter);

  let error        = new Error(message);
  error.messages   = messages;
  error.model_name = model.modelName;
  error.options    = options;

  _.merge(error, CONFIG.additional_error_fields);

  if (_is.filledString(CONFIG.link_to_errors)) {
    error[CONFIG.link_to_errors] = new_errors;
  }

  return error;
}

function parseArguments(...args) {
  const HANDLER_OPTIONS = {
    package        : CONFIG.default_package,
    exclude_errors : []
  };

  let [model, validationError, options] = args;
  if (!_is.mongooseModel(model)) {
    throw new TypeError(`Parameter 'model' expect a mongoose model, but received '${model}'`);
  }

  let error_type = CONST.ERROR_TYPE.UNSUPPORTED;
  if (_is.multiValidationError(validationError)) {
    error_type = CONST.ERROR_TYPE.MULTI;
  }
  if (_is.singleValidationError(validationError)) {
    error_type = CONST.ERROR_TYPE.SINGLE;
  }
 
  options = _.assign(HANDLER_OPTIONS, options);
  if (_.isString(options.exclude_errors)) {
    options.exclude_errors = [options.exclude_errors];
  }

  return [model, validationError, options, error_type];
}

/**
 * Validate mongoose document, handle error with hmve.
 * This just a convenience syntax with async/await.
 * @function validate
 * @param {Object} doc mongoose document
 * @param {Object} [options]
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
 *    res.status(400).json(user_friendly_error.message); 
 * }
 */
function validateDocument(doc, options) {
  const model = Object.getPrototypeOf(doc);
  if (typeof doc !== 'object' || !_is.mongooseModel(model)) {
    throw new TypeError(`Param 'doc' expect a mongoose document, but received '${doc}'`);
  }

  return new Promise((resolve) => {
    doc.validate(err => {
      if (!err) {
        return resolve();
      }
      
      let new_error = handleMongooseValidateError(model, err, options);
      resolve(new_error);
    });
  });
}

function generateLineError(model, line_error, options) {
  let err_context  = generateErrMsgContext(model, line_error, options.package);
  if (options.exclude_errors.includes(err_context.KIND)) {
    return undefined;
  }
  let msg_template = _.get(MSG_TEMPLATES[options.package], CONFIG.default_key);
  msg_template     = _.get(MSG_TEMPLATES[options.package], line_error.kind, msg_template);
  if (line_error.kind === 'user defined') {
    msg_template = line_error.message;
  }
  let message = template.compile(msg_template, err_context);
  if (CONFIG.upper_first) {
    message = _.upperFirst(message);
  }
  return {
    message  : message,
    context  : err_context,
    template : msg_template
  }
}

function generateErrMsgContext(model, err, pack) {
  const schema        = model.schema;

  if (err.name === 'CastError') {
    let type = _.toLower(err.kind);
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
``
  err.path_name   = err.path;
  err.path_name   = _.get(schema.obj, [err.path, CONFIG.path_name_key].join('.'), err.path_name);
  err.path_name   = _.get(PATH_NAMES, [model.modelName, pack, err.path].join('.'), err.path_name);

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
  _.forEach(CONFIG.additional_context_fields, (context_field, schema_field) => {
      context[context_field] = _.get(schema.obj, [context.path, schema_field].join('.'));
  });

  return context;
}

//------------------- SETTER ---------------------

/**
 * Set message template for a package
 * @param {Object} messageTemplate { <error_kind> : <message_template> }
 * @param {String} [packageName] Package name, ex: 'en', 'vi', 'jp'
 * 
 * @see getMessageTemplates('DEFAULT') to view default message template
 * 
 * @example
 * 
 * hmve.setMessageTemplates({ 
 *   DEFAULT   : '{PATH_NAME} không hợp lệ',
 *   type      : '{PATH_NAME} phải là {TYPE_NAME}',
 *   required  : 'Thiếu thông tin {PATH_NAME}',
 *   min       : '{PATH_NAME} không được nhỏ hơn {MIN}',
 *   max       : '{PATH_NAME} không được lớn hơn {MAX}',
 *   minlength : '{PATH_NAME} dài ít nhất {MIN_LENGTH} kí tự',
 *   maxlength : '{PATH_NAME} không vượt quá {MAX_LENGTH} kí tự',
 *   enum      : '{PATH_NAME} phải thuộc một trong các giá trị sau : {STRING_ENUM_VALUES}',
 *   regex     : '{PATH_NAME} không hợp lệ',
 *   unique    : '{PATH_NAME} {VALUE} đã được sử dụng, vui lòng chọn {PATH_NAME} khác',
 * }, 'vi');
 */
function setMessageTemplates(messageTemplate, packageName) {
  if (!_is.filledObject(messageTemplate)) {
    throw new TypeError(`Param 'messageTemplate' expect a object, but received '${messageTemplate}'`);
  }
  if (!_is.filledString(packageName)) {
    packageName = CONFIG.default_package;
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
 * @param {Object} typeNames  { <type> : <type_name> }
 * @param {String} [packageName] Package name, ex: 'en', 'vi', 'jp'
 * 
 * @see getTypeNames('DEFAULT') to view default type names
 * @example
 * 
 * hmve.setTypeNames({ 
 *   number  : 'số',
 *   boolean : 'luận lý',
 *   date    : 'ngày',
 *   string  : 'chuỗi',
 *   array   : 'mảng',
 *   object  : 'đối tượng',
 *   buffer  : 'bộ nhớ đệm',
 * }, 'vi');
 */
function setTypeNames(typeNames, packageName) {
  if (!_is.filledObject(typeNames)) {
    throw new TypeError(`Param 'typeNames' expect a object, but received '${typeNames}'`);
  }
  if (!_is.filledString(packageName)) {
    packageName = CONFIG.default_package;
  }
  TYPE_NAMES[packageName] = typeNames;
}

/**
 * Set path names for a package
 * @param {Object|String} model mongoose model or model name
 * @param {Object} pathNames { <path> : <path_name> }, which has the same structure as Mongoose Schema
 * @param {String} [packageName] package name, ex: 'en', 'vi'
 * 
 * @example
 * 
 * hmve.setPathNames('User', {
 *    username : 'tên tài khoản',
 *    age      : 'tuổi',
 *    address  : {
 *      country : 'quốc gia',
 *      province : 'tỉnh thành'
 *    }
 * }, 'vi');
 */
function setPathNames(model, pathNames, packageName) {
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
  if (!_is.filledObject(pathNames)) {
    throw new TypeError(`Param 'pathNames' expect a object, but received '${pathNames}'`);
  }
  if (!_is.filledString(packageName)) {
    packageName = CONFIG.default_package;
  }
  _.set(PATH_NAMES, [model_name, packageName], pathNames);
}

/**
 * Config
 * @param {Object} config config
 * @example
 * 
 * hmve.config({
 *    default_package           : 'DEFAULT',
 *    msg_delimiter             : ', ',
 *    path_name_key             : '$name',
 *    link_to_errors            : 'errors',
 *    upper_first               : true,
 *    additional_error_fields   : {
 *      error_name                : 'ValidationError',
 *      error_code                : 'ERR_MONGOOSE_VALIDATION_ERROR',
 *     },
 *    additional_context_fields : {
 *      // <context_key> : <schema_key>
 *    }
 * });
 */
function config(config) {
  if (!_is.filledObject(config)) {
    throw new TypeError(`Param 'config' expect a object, but received '${config}'`);
  }
  _.merge(CONFIG, config);
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

function getConfig() {
  return _.cloneDeep(CONFIG);
}