# HMVE
Handle mongoose validation error with custom and localize messages

## What ?
---
Mongoose has schema validation, but its error message isn't user-friendly, example :
```js
schema : fullName : { type : String, minlength : 3 }
data   : fullName : 'Bi'
```
Will generate error  message : 
```js
Path `fullName` (`Bi`) is shorter than the minimum allowed length (3).
```

With hmve, you can custom error message, like :
```
Full name must be at least 3 characters long
```

and localize :
```
(Vietnamese) Họ tên phải dài ít nhất 3 kí tự
```

## Config
Let's view simple config file, for :
* [Single language - English](simple_config/hmve-config-single-language-en.js)
* [Single language - not English](simple_config/hmve-config-single-language-not-en.js)
* [Multi language](simple_config/hmve-config-multi-language.js)

## Use

### Add path names
* For single language, just add $name to mongoose Schema :
  ```js
    username : { type : String, required : true, unique : true, $name : 'tên tài khoản' },
  ```
  If $name not specific, hmve will use path ('username') 

* For multi language, use setPathNames() with language package name
  ```js
  hmve.setPathNames(UserModel, { username : 'tên tài khoản', address : { country : 'quốc gia' } }, 'vi');
  hmve.setPathNames(UserModel, { username : 'ユーザー名'    , address : { country : '国'       } }, 'jpa');
  ```

### Handle error
hmve only handle mongoose validation error, other error type will be return directly.
  * on mongoose document validate()  
  Cann't handle unique error.
  ```js
  let user = UserModel({ username : 'boo' });
  user.validate(err => {
    err = hmve(UserModel, err);
    if (err) {
      // use can change error code by use config()
      if (err.code === 'ERR_MONGOOSE_VALIDATION_ERROR') { 
        return res.status(401).json({ error : err.message });
      }
      return res.status(500).json({ error : `ERROR DB ${err.message}` });
    }
  });
  ```

  * on mongoose model write method like create(), findOneAndUpdate(), ...   
  Can handle unique error.
  ```js
  UserModel
    .create({ username : 'boo' })
    .then(user => res.json(user))
    .catch(err => {
      err = hmve(UserModel, err);
      if (err.code === 'ERR_MONGOOSE_VALIDATION_ERROR') { 
        return res.status(401).json({ error : err.message });
      }
      return res.status(500).json({ error : `ERROR DB ${err.message}` });
    });
  ```


<a id="list-error-kinds"></a>
## List error kinds and their context variables  
Use this to write custom message templates

| KIND | CONTEXT VARIABLE |
|----- | ---------------- |
| *    | PATH, PATH_NAME, VALUE |
| type | TYPE, TYPE_NAME, STRING_VALUE |
| min  | MIN |
| max  | MAX |
| minlength | MIN_LENGTH |
| maxlength | MAX_LENGTH |
| regexp    |  |
| enum      | ENUM_VALUES, STRING_ENUM_VALUES |
| validate  |  |
| unique    |  |

## Error Object
```js
{
   "message"    : "Birthday must be a date, Username is required, Full name must be at least 3 characters long",
   "messages"   : [
     "Birthday must be a date",
     "Username is required",
     "FullName must be at least 3 characters long"
   ],
   "name"       : "ValidationError",
   "code"       : "ERR_MONGOOSE_VALIDATION_ERROR",
   "model_name" : "Users",
   "pack"       : "DEFAULT",
   "errors"     : [
     {
       "message"      : "Birthday must be a date",
       "context"      : {
         "KIND"         : "type",
         "PATH_NAME"    : "birthday",
         "PATH"         : "birthday",
         "TYPE"         : "Date",
         "TYPE_NAME"    : "date",
         "VALUE"        : "is a date?",
         "STRING_VALUE" : "\"is a date?\""
       },
       "template"     : "{PATH_NAME} must be a {TYPE_NAME}"
     },
     {
       "message"      : "Username is required",
       "context"      : {
         "KIND"         : "required",
         "PATH_NAME"    : "username",
         "PATH"         : "username"
       },
       "template"     : "{PATH_NAME} is required"
     },
     {
       "message"      : "Full name must be at least 3 characters long",
       "context"      : {
         "KIND"         : "minlength",
         "PATH_NAME"    : "full name",
         "PATH"         : "fullName",
         "VALUE"        : "Bi",
         "MIN_LENGTH"   : 3
       },
       "template"     : "{PATH_NAME} must be at least {MIN_LENGTH} characters long"
     }
   ],
}
```

## API LIST

| API | Description |
| --- | --- |
|<a href="#hmve">hmve(model, validationError, [options])</a>|<p>Handle mongoose validation error</p>|
|<a href="#validate">validate(doc, [options])</a>|<p>Validate mongoose document, handle error with hmve</p>|
|<a href="#setMessageTemplates">setMessageTemplates(messageTemplate, [packageName])</a>|<p>Set message template for a package</p>|
|<a href="#setTypeNames">setTypeNames(typeNames, [packageName])</a>|<p>Set type names for a package</p>|
|<a href="#setPathNames">setPathNames(model, pathNames, [packageName])</a>|<p>Set path names for a package</p>|
|<a href="#config">config(options)</a>|<p>Config</p>|

# Handler
<a id="hmve"></a>

## hmve(model, validationError, [options]) ⇒ <code>Object</code>
Handle only [mongoose validation error](#list-error-kinds), other error type will be return directly.
  
**Returns**: <code>Object</code> - user-friendly error  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>Object</code> | Mongoose model object or name |
| validationError | <code>Object</code> | Mongoose validation error |
| [options] | <code>Object</code> |  [options](#hvme-options) |

<a id="hvme-options"></a>
### Options
| field | Type | Description | Example |
| --- | --- | --- | --- |
| package | <code>String</code> | Language package name. Default is config.default_package. Must be provide in multi language mode. | 'vi', 'jp' |
| exclude_errors | <code>String\|Array</code> | One or more error kinds will be excluded. Ex: exclude 'required' error when validating update data. | 'required', ['required, 'unique'] |

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
     res.status(401).json(user_friendly_error.message); 
  }
});
```
<a id="validate"></a>

## validate(doc, [options]) ⇒ <code>object</code>
Validate mongoose document, handle error with hmve.
This just a convenience syntax with async/await.
  
**Returns**: <code>object</code> - user-friendly error  

| Param | Type | Description |
| --- | --- | --- |
| doc | <code>Object</code> | mongoose document |
| [options] | <code>Object</code> |  same as hmve() [options](#hvme-options)|

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
   res.status(401).json(user_friendly_error.message); 
}
```

# Setter
<a id="setMessageTemplates"></a>

## setMessageTemplates(messageTemplate, [packageName])
Set message template for a package
  
**See**: getMessageTemplates('DEFAULT') to view default message template  

| Param | Type | Description |
| --- | --- | --- |
| messageTemplate | <code>Object</code> | { <error_kind> : <message_template> } |
| [packageName] | <code>String</code> | Package name, ex: 'en', 'vi', 'jp' |

**Example**  
```js
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
```
<a id="setTypeNames"></a>

## setTypeNames(typeNames, [packageName])
Set type names for a package
  
**See**: getTypeNames('DEFAULT') to view default type names  

| Param | Type | Description |
| --- | --- | --- |
| typeNames | <code>Object</code> | { <type> : <type_name> } |
| [packageName] | <code>String</code> | Package name, ex: 'en', 'vi', 'jp' |

**Example**  
```js
hmve.setTypeNames({ 
  number  : 'số',
  boolean : 'luận lý',
  date    : 'ngày',
  string  : 'chuỗi',
  array   : 'mảng',
  object  : 'đối tượng',
  buffer  : 'bộ nhớ đệm',
}, 'vi');
```
<a id="setPathNames"></a>

## setPathNames(model, pathNames, [packageName])
Set path names for a package
  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>Object</code> \| <code>String</code> | mongoose model or model name |
| pathNames | <code>Object</code> | { <path> : <path_name> }, which has the same structure as Mongoose Schema |
| [packageName] | <code>String</code> | package name, ex: 'en', 'vi' |

**Example**  
```js
hmve.setPathNames('User', {
   username : 'tên tài khoản',
   age      : 'tuổi',
   address  : {
     country : 'quốc gia',
     province : 'tỉnh thành'
   }
}, 'vi');
```
<a id="config"></a>

## config(options)
set options
  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | options |

**Example**  
```js
hmve.config({
   default_package           : 'DEFAULT',
   msg_delimiter             : ', ',
   path_name_key             : '$name',
   link_to_errors            : 'errors',
   link_to_origin_error      : false,
   additional_error_fields   : {
     error_name                : 'ValidationError',
     error_code                : 'ERR_MONGOOSE_VALIDATION_ERROR',
    },
   additional_context_fields : {
     // <context_key> : <schema_key>
   }
});
```
