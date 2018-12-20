module.exports = {
  default_key               : 'DEFAULT',
  default_package           : 'DEFAULT',
  msg_delimiter             : ', ',
  path_name_key             : '$name',
  upper_first                : true,
  link_to_errors            : 'errors',
  additional_error_fields   : {
    name                : 'ValidationError',
    code                : 'ERR_MONGOOSE_VALIDATION',
  },
  additional_context_fields : {
    // <context_key> : <schema_key>
  }
};

