/**
 * Simple hmve config for single language - English
 */

'use strict';

const hmve = require('hmve');

/* Config error message templates.
This is default message templates, if you like it, skip it.
*/
hmve.setMessageTemplates({
  DEFAULT   : 'Invalid {PATH_NAME}',
  type      : '{PATH_NAME} must be a {TYPE_NAME}',
  required  : '{PATH_NAME} is required',
  min       : "{PATH_NAME} can't not less than {MIN}",
  max       : "{PATH_NAME} can't greater than {MAX}",
  minlength : '{PATH_NAME} must be at least {MIN_LENGTH} characters long',
  maxlength : '{PATH_NAME} must be at most {MAX_LENGTH} characters long',
  enum      : '{PATH_NAME} must be one of the following: {STRING_ENUM_VALUES}',
  match     : 'Invalid {PATH_NAME}',
  unique    : '{PATH_NAME} {VALUE} have been used, please choose another',
});

/* Config type names
This is default type names, if you like it, skip it
*/
hmve.setTypeNames({
  number  : 'number',
  boolean : 'boolean',
  date    : 'date',
  string  : 'string',
  array   : 'array',
  object  : 'object',
  buffer  : 'buffer'
});