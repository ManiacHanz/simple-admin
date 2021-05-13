const Controller = require("egg").Controller;
const cn = require('china-region')

module.exports = class AuthController extends Controller {
  async get_index() {
    const provinces = cn.getProvinces()
    this.ctx.body = provinces
  }
};
