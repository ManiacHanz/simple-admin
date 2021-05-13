const parse = require("../utils/dsl");
const paginate = require("./plugin/paginate");
/**
 * 修改指定字段为virtual字段
 * @param {Object} schema 添加字段的schema
 * @param {Object} opts virtual 第二个参数字段
 */
function setVirtual(schema, field, { ref, localField, foreignField, justOne = true }) {
    schema.virtual(field, {
        ref,
        localField,
        foreignField,
        justOne
    })

    schema.set('toObject', { virtuals: true });
    schema.set('toJSON', { virtuals: true });
}

function getSchemaOptions(name) {
    const list = ['Synclog']
    if (list.includes(name)) return { timestamps: true }
    return {}
}

module.exports = (app) => {
    const { Schema } = app.mongoose;
    const mongooseDB = app.mongooseDB;
    
    const schemas = parse(app.schemas);
    // 注册model
    const models = Object.keys(schemas)
        .reduce((pre, name) => {
            const def = schemas[name];
            const options = getSchemaOptions(name)
            const schema = new Schema(def, options);

            schema.plugin(paginate(app));

            const model = mongooseDB.get("db1").model(name, schema);
            pre[name] = model;
            return pre;

        }, {});

    // 添加 populate
    // setVirtual(models.User.schema, 'department', {
    //     ref: 'Department',
    //     localField: 'departmentId',
    //     foreignField: 'id'
    // })

    // setVirtual(models.Request.schema, 'user', {
    //     ref: 'User',
    //     localField: 'userId',
    //     foreignField: 'userId'
    // })

    // setVirtual(models.Department.schema, 'status', {
    //     ref: 'DepartmentStatus',
    //     localField: 'id',
    //     foreignField: 'depId',
    // })

    app.models = Object.assign({}, app.model, models);

    // 添加 models 到 ctx
    app.use(async function (ctx, next) {
        ctx.models = ctx.app.models;
        await next();
    })
}
