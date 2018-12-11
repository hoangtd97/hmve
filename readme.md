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

## How ?
---
* Custom error message templates  
HMVE have configured default English message template, you can see it by call getMessageTemplates('DEFAULT'). If don't like, take your own :
```js
const hmve = require('hmve');

hmve.setMessageTemplates('en', {
  minlength : '{PATH_NAME} must be at least {MIN_LENGTH} characters long'
  //...
});

hmve.setMessageTemplates('vi', {
  minlength : '{PATH_NAME} phải dài ít nhất {MIN_LENGTH} kí tự',
  //...
});
```

* Custome type names 
for not-English language
```js
hmve.setTypeNames('vi', {
  number : 'số',
  string : 'chuỗi',
  //...
});
```

* Custom path names  
Schema paths are not always easy to read, especially for deep paths. 'Full name', 'country' are more readable then 'fullName', 'address.country', right ?
You can custom path names in two way :
  * Set directly in the schema with $name property, it apply to all language package
  ```js
  let UsersSchema = new Schema({
    fullName : { type : String, minlength : 3, $name : 'full name' },
    address : {
      country : { type : String, $name : 'country' }
    }
  });
  ```
  * Use custom function, can set for each language package, and overwite $name
  ```js
  hmve.setPathNames('User', 'en', {
    fullName : 'full name',
    address  : {
      country : 'country'
    }
  });

  hmve.setPathNames('User', 'vi', {
    fullName : 'Họ tên'
    address  : {
      country : 'quốc gia'
    }
  });
  ```

* Generate user-friendly error  
You can do this in two way :
  * Wap mongoose validation error
  ```js
  let user = UsersModel({ fullName : 'Bi' );

  user.validate(err => {
    let en_user_friendly_error = hmve(UsersModel, err, 'en');
    //=> en_user_friendly_error.message = 'Full name must be at least 3 characters long';
    let vi_user_friendly_error = hmve(UsersModel, err, 'vi');
    //=> vi_user_friendly_error.message = 'Họ tên phải dài ít nhất 3 kí tự';
  });
  ```

  * Use hmve.validate() function
  ```js
  let user = UsersModel({ fullName : 'Bi' );

  let en_user_friendly_error = await hmve.validate(user, 'en');
  //=> en_user_friendly_error.message = 'Full name must be at least 3 characters long';
  let vi_user_friendly_error = await hmve.validate(user, 'vi');
  //=> vi_user_friendly_error.message = 'Họ tên phải dài ít nhất 3 kí tự';
  ```

## List Error kind (validator) and their context variables  
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

## Error Object
```js
{
   "message" : "Birthday must be a date, Username is required, Full name must be at least 3 characters long",
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
       "message": "Full name must be at least 3 characters long",
       "context": {
         "KIND": "minlength",
         "PATH_NAME": "full name",
         "PATH": "fullName",
         "VALUE": "Bi",
         "MIN_LENGTH": 3
       },
       "template": "{PATH_NAME} must be at least {MIN_LENGTH} characters long"
     }
   ],
}
```

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
Handle mongoose validation error, other error types will throw immediately.
 
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
```

<a id="validate"></a>

## validate(doc, [pack]) ⇒ <code>object</code>
Validate mongoose document, handle error with hmve
 
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
