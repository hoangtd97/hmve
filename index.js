'use strict';

const DEFAULT_ERR_CONTEXT  = require('./default/error_context');
const DEFAULT_MSG_TEMPLATE = require('./default/message_template');
const DEFAULT_TYPE_NAME    = require('./default/type_name');
const DEFAULT_OPTIONS      = require('./default/options');

const hmve                 = require('./hmve');

hmve.setOptions(DEFAULT_OPTIONS);
hmve.setErrorContexts(DEFAULT_ERR_CONTEXT);
hmve.setTypeNames(DEFAULT_TYPE_NAME);
hmve.setMessageTemplates(DEFAULT_MSG_TEMPLATE);

module.exports = hmve;