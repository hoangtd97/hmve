# HMVE
Handle mongoose validation error with custom and localize messages

## API LIST

| API | Description |
| --- | --- |
|<a href="#hmve">hmve(model, validationError, [pack])</a>|<p>Handle mongoose validation error</p>|
|<a href="#validate">validate(doc, [pack])</a>|<p>Validate mongoose document, handle error with hmve</p>|
|<a href="#setMessageTemplates">setMessageTemplates(packageName, messageTemplate)</a>|<p>Set message template for a package</p>|
|<a href="#setTypeNames">setTypeNames(packageName, typeNames)</a>|<p>Set type names for a package</p>|
|<a href="#setPathNames">setPathNames(model, packageName, pathNames)</a>|<p>Set path names for a package</p>|
|<a href="#setOptions">setOptions(options)</a>|<p>set options</p>|

# Handler
<a id="hmve"></a>

## hmve(model, validationError, [pack]) ⇒ <code>Object</code>
Handle mongoose validation error

**Kind**: global function  
**Returns**: <code>Object</code> - user-friendly error  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>Object</code> | Mongoose model object or name |
| validationError | <code>Object</code> | Mongoose validation error |
| [pack] | <code>String</code> | package name, default is options.default_package |

**Example**  
```js
const hmve = require('hmve');

const UsersSchema = new Schema({
  username : { type : String, required : true                                  },
  fullName : { type : String, required : false, minlength : 3, maxlength : 100 },
  birthday : { type : Date  , required : false                                 },
});

const UsersModel = mongoose.model('Users', UsersSchema, 'Users');

let user = UsersModel({
  fullName : 'Bi',
  birthday : 'is a date?',
});

user.validate(err => {
  user_friendly_error = hmve(UsersModel, err);
  if (user_friendly_error) {
     res.status(422).json(user_friendly_error.message); 
  }
});


// user_friendly_error look like :
{
   "message" : "Birthday must be a date, Username is required, FullName must be at least 3 characters long",
   "messages": [
     "Birthday must be a date",
     "Username is required",
     "FullName must be at least 3 characters long"
   ]
   "model_name": "Users",
   "pack": "DEFAULT",
   "errors": [
     {
       "message": "Birthday must be a date",
       "context": {
         "KIND": "type",
         "PATH_NAME": "birthday",
         "PATH": "birthday",
         "TYPE": "Date",
         "TYPE_NAME": "date",
         "VALUE": "is a date?",
         "STRING_VALUE": "\"is a date?\""
       },
       "template": "{PATH_NAME} must be a {TYPE_NAME}"
     },
     {
       "message": "Username is required",
       "context": {
         "KIND": "required",
         "PATH_NAME": "username",
         "PATH": "username"
       },
       "template": "{PATH_NAME} is required"
     },
     {
       "message": "FullName must be at least 3 characters long",
       "context": {
         "KIND": "minlength",
         "PATH_NAME": "fullName",
         "PATH": "fullName",
         "VALUE": "Bi",
         "MIN_LENGTH": 3
       },
       "template": "{PATH_NAME} must be at least {MIN_LENGTH} characters long"
     }
   ],
}
```
<a id="validate"></a>

## validate(doc, [pack]) ⇒ <code>object</code>
Validate mongoose document, handle error with hmve

**Kind**: global function  
**Returns**: <code>object</code> - user-friendly error  

| Param | Type | Description |
| --- | --- | --- |
| doc | <code>Object</code> | mongoose document |
| [pack] | <code>String</code> | package name, default is options.default_package |

**Example**  
```js
const hmve = require('hmve');

const UsersSchema = new Schema({
  username : { type : String, required : true                                  },
  fullName : { type : String, required : false, minlength : 3, maxlength : 100 },
  birthday : { type : Date  , required : false                                 },
});

const UsersModel = mongoose.model('Users', UsersSchema, 'Users');

let user = UsersModel({
  fullName : 'Bi',
  birthday : 'is a date?',
});

let user_friendly_error = await hmve.validate(user);
if (user_friendly_error) {
   res.status(422).json(user_friendly_error.message); 
}
```

# Setter
<a id="setMessageTemplates"></a>

## setMessageTemplates(packageName, messageTemplate)
Set message template for a package

**Kind**: global function  
**See**: getErrorContexts to view all message template variable  

| Param | Type | Description |
| --- | --- | --- |
| packageName | <code>String</code> | Package name, ex: 'en', 'vi', 'jp' |
| messageTemplate | <code>Object</code> | { <error_kind> : <message_template> } |

**Example**  
```js
hmve.setMessageTemplates('vi', { 
  DEFAULT   : '{PATH_NAME} không hợp lệ',
  type      : '{PATH_NAME} phải là {TYPE_NAME}',
  required  : 'Thiếu thông tin {PATH_NAME}',
  min       : '{PATH_NAME} không được nhỏ hơn {MIN}',
  max       : '{PATH_NAME} không được lớn hơn {MAX}',
  minlength : '{PATH_NAME} dài ít nhất {MIN_LENGTH} kí tự',
  maxlength : '{PATH_NAME} không vượt quá {MAX_LENGTH} kí tự',
  enum      : '{PATH_NAME} phải thuộc một trong các giá trị sau : {STRING_ENUM_VALUES}',
  regex     : '{PATH_NAME} không hợp lệ',
});
```
<a id="setTypeNames"></a>

## setTypeNames(packageName, typeNames)
Set type names for a package

**Kind**: global function  
**See**: getTypeNames('DEFAULT') to view default type names  

| Param | Type | Description |
| --- | --- | --- |
| packageName | <code>String</code> | Package name, ex: 'en', 'vi', 'jp' |
| typeNames | <code>Object</code> | { <type> : <type_name> } |

**Example**  
```js
hmve.setTypeNames('vi', { 
  Number  : 'số',
  Boolean : 'luận lý',
  Date    : 'ngày',
  String  : 'chuỗi',
  Array   : 'Mảng',
  Object  : 'Đối tượng'
});
```
<a id="setPathNames"></a>

## setPathNames(model, packageName, pathNames)
Set path names for a package

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>Object</code> \| <code>String</code> | mongoose model or model name |
| packageName | <code>String</code> | package name, ex: 'en', 'vi' |
| pathNames | <code>Object</code> | { <path> : <path_name> }, which has the same structure as Mongoose Schema |

**Example**  
```js
hmve.setPathNames('User', 'vi', {
   username : 'tên tài khoản',
   age      : 'tuổi',
   address  : {
     country : 'quốc gia',
     province : 'tỉnh thành'
   }
});
```
<a id="setOptions"></a>

## setOptions(options)
set options

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | options |

**Example**  
```js
hmve.setOptions({
   default_package           : 'DEFAULT',
   msg_delimiter             : ', ',
   path_name_key             : '$name',
   link_to_origin_error      : false,
   additional_context_fields : {
     // <context_key> : <schema_key>
   }
});
```
