/**
 * Simple hmve config for single language - not English.
 * This use Vietnamese to demo.
 */

'use strict';

const hmve = require('hmve');

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
});

/* Config type name */
hmve.setTypeNames({
  number  : 'số',
  boolean : 'luận lý',
  date    : 'ngày',
  string  : 'chuỗi',
  array   : 'mảng',
  object  : 'đối tượng',
  buffer  : 'bộ nhớ đệm'
});