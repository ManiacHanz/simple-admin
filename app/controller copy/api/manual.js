/* 调试线上接口， 不要在项目中调用 */
const Controller = require('egg').Controller;
const date = require('../../utils/date')

module.exports = class ManualController extends Controller {
  // 更新用户表
  async get_updateAllUsers() {
    const { User } = this.ctx.models;
    const { dep_id = 1 } = this.ctx.query;
    const userlist = await this.service.sso.departmentUser(dep_id);

    userlist.forEach(item => {
      const department = item.mainDepartment;
      const { position, userId, name, isLeader } = item;
      const info = {
        position,
        userId,
        name,
        departmentId: department || dep_id,
        isLeader
      };
      User.findOneAndReplace({ userId }, info, { upsert: true }, function (
        err,
        data
      ) {
        // console.log(49, err || data);
      });
    });
    this.ctx.body = userlist;
  }

  // 强制更新部门表
  async get_updateDeps() {
    const { Department } = this.ctx.models;
    // 获取企业微信数据
    const departments = await this.service.sso.get('departments');
    // 保存到数据库
    departments.forEach(item => {
      Department.findOneAndReplace(
        { id: item.id },
        item,
        { upsert: true },
        function () { }
      )
    });
    this.ctx.body = departments;
  }

  /**
   * TODO: remove  删除用户表
   */
  async get_clear() {
    const data = await this.ctx.models.User.deleteMany({});
    this.ctx.body = {
      data
    };
  }

  async get_fixSynclog() {
    const synclogs = await this.ctx.models.Synclog.find({}, {}, { sort: { hour: 1 } })

    const sds = await this.ctx.models.SpecialDate.find()
    const specialDays = sds.reduce((p, c) => { return c.isSpecial === 1 ? [...p, c._id] : p }, [])

    const documents = synclogs.reduce((pre, curr) => {

      const dateNum = date.time(curr.hour).format('YYYY-MM-DD')
      if (specialDays.includes(dateNum)) return pre

      const day = date.day(curr.hour)
      if (day === 0 || day === 6) {
        if (date.time(curr.hour).isAfter(`${dateNum} 21:00:00`)) {
          return [...pre, curr]
        }

      } else if (day === 1) {
        // 小于4点
        if (date.time(curr.hour).isBefore(`${dateNum} 04:00:00`)) {
          return [...pre, curr]
        }
      }

      return pre
    }, [])
    this.ctx.body = { documents, counts: documents.length }
  }
};
