const Controller = require("egg").Controller;

module.exports = class AuthController extends Controller {
  async index() {
    this.ctx.body = 'hello world'
  }
  async post_login(){
    const {username, password} = this.ctx.request.body;
    
  }
};
