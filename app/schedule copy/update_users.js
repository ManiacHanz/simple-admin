const Subscription = require('egg').Subscription;

class UpdateUsers extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    // 每天6点拉一次员工数据
    return {
      cron: '0 0 6 * * *',
      type: 'all'
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    // this.ctx.service.work.updateUsers(1)
    // 拉取人员的任务
    this.ctx.logger.info('人员定时任务: ', new Date())
  }
}

module.exports = UpdateUsers;