const Controller = require("egg").Controller;

class AnnualController extends Controller {
  async post_add() {
    // 防止重复调用
    const { time, user, content } = this.ctx.request.body;

    const update = await this.ctx.service.annual.add(user, time, content);

    // 增加调休总数
    this.ctx.body = { update };
  }

  async post_use() {
    // 防止重复调用
    const { time, user, content } = this.ctx.request.body;
    const update = await this.ctx.service.annual.use(user, time, content);

    // 增加调休总数
    this.ctx.body = { update };
  }
}

module.exports = AnnualController;
