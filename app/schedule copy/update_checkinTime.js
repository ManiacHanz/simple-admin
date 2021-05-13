const Subscription = require('egg').Subscription;

class UpdateCheckinTime extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    // 每一天的6点拉一次
    return {
      cron: '0 0 6 * * 2/6',
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    // 执行企微的任务
    // await this.ctx.service.work.updateCheckinTime(1)
    this.ctx.logger.info('加班时间定时任务：', new Date())
  }
}

module.exports = UpdateCheckinTime;