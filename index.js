'use strict';

const DEFAULT_ERR_CONTEXT  = require('./default/error_context');
const DEFAULT_MSG_TEMPLATE = require('./default/message_template');
const DEFAULT_TYPE_NAME    = require('./default/type_name');
const DEFAULT_CONFIG      = require('./default/config');

const hmve                 = require('./hmve');

hmve.config(DEFAULT_CONFIG);
hmve.setErrorContexts(DEFAULT_ERR_CONTEXT);
hmve.setTypeNames(DEFAULT_TYPE_NAME);
hmve.setMessageTemplates(DEFAULT_MSG_TEMPLATE);

module.exports = hmve;