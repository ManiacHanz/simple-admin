const Controller = require("egg").Controller;
const parse = require("../utils/dsl");

module.exports = class UserController extends Controller {
  async get_info() {
    const { ctx } = this;

    const ast = parse(`
      type User {
        name: String!
      }
    `);
    ctx.body = {
      name: ast
    };
  }

  async get_test() {
    const { ctx } = this;
    // insert user info
    const res = await ctx.models.File.create({
      name: 'test'
    })
    ctx.body = res
  }
};
