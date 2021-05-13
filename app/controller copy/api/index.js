const Controller = require("egg").Controller;

module.exports = class UserController extends Controller {
    // 
    async get_token() {
        const { ctx } = this;
        // 通过store 获取
        const token = await this.service.wechat.getAccessToken();
        ctx.body = token;
    }

    async get_checkin_token() {
        const { ctx } = this;
        const token = await this.service.wechat.getCheckinToken();

        ctx.body = token;
    }

}