const Service = require('egg').Service;

class AnnualService extends Service {
  async add(user, time, content) {
    // 插入增加调休记录
    const { User } = this.ctx.models;

    const update = await User.findOneAndUpdate(
      { userId: user },
      { $inc: { annual: time, left_annual: time } }
    ).exec();

    this.ctx.service.log.write({
      target: user,
      type: 'annual',
      handle: 'add',
      time: time,
      content
    });
    return update;
  }

  async use(user, time, content) {
    const { User } = this.ctx.models;

    // 检查剩余可用调休
    const update = await User.findOneAndUpdate(
      {
        userId: user,
        left_annual: {
          $gte: time
        }
      },
      { $inc: { used_annual: time, left_annual: time * -1 } }
    ).exec();

    if (!update) {
      throw {
        code: 10000,
        message: '没有找到相关用户或扣减所需天数不够',
        data: null
      };
      return;
    }

    this.ctx.service.log.write({
      target: user,
      type: 'annual',
      handle: 'use',
      time: time,
      content
    });

    return update;
  }
}

module.exports = AnnualService;
