// Consolidate all lambda handlers into a single file

const rest = require('./rest');
const s3 = require('./s3');
const graphql = require('./graphql');
const reprocess = require('./reprocess');
module.exports.rest = rest.handler;
module.exports.graphql = graphql.handler;
module.exports.s3 = s3.handler;
module.exports.reprocess = reprocess.handler;
