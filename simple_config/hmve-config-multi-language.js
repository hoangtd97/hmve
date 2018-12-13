/**
 * Simple hmve config for multi-language.
 * Like configuration for single language, just add the language package name.
 */

'use strict';

const hmve = require('hmve');

/*---------------------------------- en - English ----------------------------------------*/

/* Config error message templates. */
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
}, 'en');

/* Config type names. */
hmve.setTypeNames({
  number  : 'number',
  boolean : 'boolean',
  date    : 'date',
  string  : 'string',
  array   : 'array',
  object  : 'object',
  buffer  : 'buffer'
}, 'en');

/*---------------------------------- vi - Vietnamese ----------------------------------*/

/* Config error message templates. */
hmve.setMessageTemplates({
  DEFAULT   : '{PATH_NAME} không hợp lệ',
  type      : '{PATH_NAME} phải là {TYPE_NAME}',
  required  : 'Thiếu thông tin {PATH_NAME}',
  min       : '{PATH_NAME} không được nhỏ hơn {MIN}',
  max       : '{PATH_NAME} không được lớn hơn {MAX}',
  minlength : '{PATH_NAME} dài ít nhất {MIN_LENGTH} kí tự',
  maxlength : '{PATH_NAME} không vượt quá {MAX_LENGTH} kí tự',
  enum      : '{PATH_NAME} phải thuộc một trong các giá trị sau : {STRING_ENUM_VALUES}',
  regex     : '{PATH_NAME} không hợp lệ',
  unique    : '{PATH_NAME} {VALUE} đã được sử dụng, vui lòng chọn {PATH_NAME} khác',
}, 'vi');

/* Config type name */
hmve.setTypeNames({
  number  : 'số',
  boolean : 'luận lý',
  date    : 'ngày',
  string  : 'chuỗi',
  array   : 'mảng',
  object  : 'đối tượng',
  buffer  : 'bộ nhớ đệm'
}, 'vi');

/*---------------------------------- other language ----------------------------------*/
