const { parse } = require('graphql/language');
var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PrimayTypes = ['String', 'Int'];

const TYPES = {
  String: String,
  Int: Number,
  Boolean: Boolean,
  Date: Date,
  ID: Schema.Types.ObjectId,
  Object: Object
};

function getType(type) {
  switch (type.kind) {
    case 'ListType':
      const named = type.type.name.value;
      //TODO: 非默认类型时
      return [TYPES[named]];
    case 'NamedType':
      return TYPES[type.name.value];
    case 'NonNullType':
      return getType(type.type);
    default:
      break;
  }
}

// TODO: 优化 directive
function parseDirective(field, directives) {
  return directives.reduce((pre, cur) => {
    const name = cur.name.value;
    switch (name) {
      case 'relation':
        break;
      case 'default':
        field['default'] = cur.arguments[0].value.value;
        break;
      default:
        field[name] = true;
        break;
    }
    return field;
  }, field);
}

module.exports = dsl => {
  if (!dsl) {
    return null;
  }

  const original = parse(dsl);

  const parseField = ast => {
    const field = {};
    field.type = getType(ast.type);
    if (ast.type.kind === 'NonNullType') {
      field.required = true;
    }

    parseDirective(field, ast.directives);
    return field;
  };

  const parseModel = model => {
    return model.fields.reduce((pre, cur) => {
      const field = cur.name.value;
      pre[field] = parseField(cur);
      return pre;
    }, {});
  };

  const mongoose = original.definitions.reduce((pre, cur) => {
    const name = cur.name.value;
    pre[name] = parseModel(cur);
    return pre;
  }, {});

  return mongoose;
};
