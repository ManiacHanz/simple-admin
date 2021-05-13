const Controller = require("egg").Controller;
const moment = require("moment");
module.exports = class UserController extends Controller {
  async get_user() {
    const { ctx } = this;
    const user = ctx.state.user.userId;
    // TODO 需不需要给默认的当前月份
    const { query = {} } = ctx;

    const params = { user, ...query };
    const logs = await ctx.service.log.list(params);

    const data = logs.map(item => {
      return {
        ...item,
        created_at: moment(item.created_at).format("YYYY-MM-DD HH:mm")
      };
    });

    ctx.body = data;
  }
};
