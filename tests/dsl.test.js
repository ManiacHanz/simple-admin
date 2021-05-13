const parse = require("../app/utils/dsl");
const fs = require('fs');
const path = require('path');

const dsl = fs.readFileSync(path.join(__dirname, '../app/model', 'schema.graphql')).toString();
const schemas = parse(dsl);