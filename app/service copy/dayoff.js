const Service = require('egg').Service;

// 调休记录的
class DayoffService extends Service {
  // 手动添加调休记录
  async add({ user, time, handle = 'add', content }, notAddTime) {
    const { User } = this.ctx.models;

    if (!notAddTime) {
      // 有些情况下不需要增加时间，只用同步日志
      const update = await User.findOneAndUpdate(
        { userId: user },
        { $inc: { overtime: time * 60, left_overtime: time * 60 } }
      ).exec();
    }

    this.ctx.service.log.write({
      target: user,
      type: 'dayoff',
      handle,
      time: time * 60,
      content
    });
    return 'success';
  }

  // 手动扣除调休时间
  async use(user, time, content) {
    const { User } = this.ctx.models;

    // 检查剩余可用调休
    const update = await User.findOneAndUpdate(
      {
        userId: user,
        left_overtime: {
          $gte: time * 60
        }
      },
      { $inc: { used_overtime: time * 60, left_overtime: time * 60 * -1 } }
    ).exec();

    if (!update) {
      throw {
        code: 10000,
        message: '没有找到相关用户或扣减所需时间不够',
        data: null
      };
      return;
    }

    this.ctx.service.log.write({
      target: user,
      type: 'dayoff',
      handle: 'use',
      time: time * 60,
      content
    });

    return update;
  }

  // 自动同步时间时候的自动添加调休时间
  async autoAdd(documents) {
    const { ctx } = this
    for (let i = 0; i < documents.length; i++) {
      try {
        const doc = documents[i]
        const result = await ctx.models.Synclog.create(
          doc
        )
        await ctx.models.User.findOneAndUpdate(
          { userId: doc._id.userId },
          { $inc: { overtime: doc.minutes, left_overtime: doc.minutes }, $set: { updateTime: +new Date() } }
        )
      } catch (err) {
        // console.log('err: ', documents[i])
        // 这里错误是否该有其他逻辑，还是只 考虑重复时的错误
      }
    }
  }
}

module.exports = DayoffService;
