module.exports = {
  // <error_kind> : { <context_field> : <mongoose_error_field> }
  base            : {
    KIND          : 'kind',
    PATH_NAME     : 'path_name',
    PATH          : 'path',
  },
  type            : {
    TYPE          : 'type',
    TYPE_NAME     : 'type_name',
    VALUE         : 'value',
    STRING_VALUE  : 'stringValue'
  },
  min             : {
    VALUE         : 'value',
    MIN           : 'properties.min',
  },
  max             : {
    VALUE         : 'value',
    MAX           : 'properties.max',
  },
  minlength       : {
    VALUE         : 'value',
    MIN_LENGTH    : 'properties.minlength',
  },
  maxlength       : {
    VALUE         : 'value',
    MAX_LENGTH    : 'properties.maxlength',
  },
  regexp          : {
    VALUE         : 'value',
  },
  enum            : {
    VALUE              : 'value',
    ENUM_VALUES        : 'properties.enumValues',
    STRING_ENUM_VALUES : 'properties.stringEnumValues',
  },
  validate        : {
    VALUE         : 'value',
  }
};