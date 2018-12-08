module.exports = {
  // <error_kind> : <context>
  base            : {
    kind          : 'kind',
    path_name     : '$name',
    path          : 'path',
  },
  type            : {
    type          : 'type',
    type_name     : 'type_name',
    value         : 'value',
    stringValue   : 'stringValue'
  },
  min             : {
    value         : 'value',
    min           : 'properties.min',
  },
  max             : {
    value         : 'value',
    max           : 'properties.max',
  },
  minlength       : {
    value         : 'value',
    min_length    : 'properties.minlength',
  },
  maxlength       : {
    value         : 'value',
    max_length    : 'properties.maxlength',
  },
  regexp          : {
    value         : 'value',
  },
  enum            : {
    value              : 'value',
    enum_values        : 'properties.enumValues',
    enum_values_string : 'properties.enumValuesString',
  }
};