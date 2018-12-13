module.exports = {
  MONGOOSE_UNIQUE_ERROR_TEMPLATE : 'E11000 duplicate key error collection: {collection} index: {index} dup key: { : {value} }',
  MONGOOSE_INDEX_TEMPLATE        : '{path}_{direct}',

  ERROR_TYPE : {
    MULTI       : 1,         // when validate or save
    SINGLE      : 3,        // when update
    UNSUPPORTED : 5, 
  }
};