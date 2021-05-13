/* 
 * 主要是用于一些业务以外的任务
 * 同步员工打卡信息
 */
const Controller = require('egg').Controller;
const moment = require('moment');

const format = cri => time => time.format(cri);

module.exports = class UserController extends Controller {
  /**
  * 同步员工信息
  * 初始化方法
  * 按月份同步，如果没有月份则同步当前月
  * 需要把同步后有加班的记录写到表里，避免重复写入
  */
  // TODO 还没有把时间参数修改出来
  async get_sync() {
    const { ctx } = this;
    const { dep_id } = ctx.query;

    const result = await this.ctx.service.work.updateCheckinTime(dep_id, 'init')

    ctx.body = result
  }

  // 初始化员工数据
  async get_initUsers() {
    // 1是全部公司的人员
    const { dep_id = 1 } = this.ctx.query;
    const insert = await this.service.work.updateUsers(dep_id)

    this.ctx.body = {
      count: insert.length,
      insert
    };
  }

  async get_syncday() {
    const { ctx } = this;
    const { dep_id } = ctx.query;

    const result = await this.ctx.service.work.updateCheckinTime(dep_id, 'day')

    ctx.body = result
  }

}