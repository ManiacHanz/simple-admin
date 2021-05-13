/* 主要是用来做定时服务的service */
const Service = require('egg').Service;
const date = require('../utils/date');
const moment = require('moment');

const format = cri => time => time.format(cri);

class WorkService extends Service {
  // type = day 时是同步当天记录， = init时是初始化项目
  async updateCheckinTime(dep_id, type = 'day') {
    const { ctx } = this;
    // 通过部门id获取所有员工列表
    const dep_users = await ctx.service.sso.departmentUser(dep_id);
    const dep_userIds = dep_users.map(user => user.userId)
    // 人员分组：企业微信的长度限制
    let userIdLists = []
    while (dep_userIds.length > 0) {
      userIdLists.push(dep_userIds.splice(0, 100))
    }
    let parts = []
    if (type === 'day') {
      const yestoday = date.lastDay(date.now())
      parts = await userIdLists.map(async list => await ctx.service.checkin.day(yestoday, list))
    } else {
      const monthArr = date.countMonths()
      monthArr.forEach(month => {
        userIdLists.forEach(list => parts.push(ctx.service.checkin.month(month, list)))
      })
    }

    const result = await Promise.all(parts)

    // 存Synclog 避免重复
    const logs = result.reduce((pre, curr) => {
      const list = curr.list
      // if (curr.list.length > 0) console.log(curr.list.length) 
      return [...pre, ...list]
    }, [])

    // 拼装写入数据库的documents
    const documents = logs.map(log => ({ _id: { userId: log.userId, checkinTime: log.checkinTime }, minutes: log.minutes }))
    // TODO 用的话此处需要改
    for (let i = 0; i < documents.length; i++) {
      try {
        const doc = documents[i]
        const result = await ctx.models.Synclog.collection.insertOne(
          doc
        )
        await ctx.models.User.findOneAndUpdate(
          { userId: doc._id.userId },
          { $inc: { overtime: doc.minutes, left_overtime: doc.minutes } }
        )
      } catch (err) {
        // console.log('err: ', documents[i])
      }
    }
    ctx.body = logs
  }

  async updateUsers(dep_id) {
    const userlist = await this.service.sso.departmentUser(dep_id);

    const insert = userlist.map(item => {
      const department = item.mainDepartment;
      const { position, userId, name, isLeader } = item;

      return {
        position,
        userId,
        name,
        departmentId: department || dep_id,
        isLeader
      };
    });

    insert.forEach(async user => {
      const { userId, position,
        name,
        departmentId,
        isLeader } = user
      await this.ctx.models.User.findOneAndUpdate(
        { userId },
        { $set: { userId, name, departmentId, isLeader, position } },
        { upsert: true }
      )
    })
    return insert
  }
}

module.exports = WorkService;
