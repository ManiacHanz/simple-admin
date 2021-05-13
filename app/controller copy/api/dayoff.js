const Controller = require('egg').Controller;
const moment = require('moment');

const format = cri => time => time.format(cri);

function checkinByTime(input = [], extra) {
  const users = {};

  const insert = input
    .reduce((pre, cur) => {
      const { userId: userid, checkinTime: checkin_time } = cur;
      const time = moment.unix(checkin_time);
      // 当天9点
      const criteria = moment(time)
        .hours(21)
        .minutes(0)
        .seconds(0);
      // @TODO: 次日6点 ？算法需要重订

      // 下班时间超过 9 点，30分钟为起点计入加班
      const diff = time.diff(criteria);
      const minutes = Math.floor(diff / 60000 / 30);

      if (diff > 0) {
        // pre[userid] = last + parseInt(diff / 60000)
        const item = {
          time: minutes * 30,
          userid,
          date: format('YYYY-MM-DD HH:mm')(time)
        };
        pre.push({
          ...item,
          ...extra(item)
        });

        users[userid] = (users[userid] || 0) + minutes * 30;
      }

      return pre;
    }, [])
    .filter(item => item.time);

  return [insert, users];
}

module.exports = class UserController extends Controller {
  async get_list() {
    const { ctx } = this;
    const { page, pageSize, ...rest } = ctx.request.query;

    // 拿到所有的开启的部门id
    const enableDepDocs = await this.service.deps.list({ active: 1 })
    const enableDepIds = enableDepDocs.map(dep => dep.depId)

    // 去掉undefined参数 把字符串转成数字
    const params = ctx.helper.queryParse(rest);
    if (params.departmentId) {
      if (Array.isArray(params.departmentId)) {
        params.departmentId = { $in: params.departmentId };
      }
    } else {
      // 没传id 从默认开启的id里面去找
      params.departmentId = { $in: enableDepIds }
    }

    if (params.name) {
      const reg = new RegExp(params.name);
      Object.assign(params, { name: { $regex: reg } });
    }
    // 分页:
    const list = await ctx.models.User.paginate(ctx.query, params, {
      populate: { path: 'department', select: 'id name' }
    });

    ctx.body = list;
  }

  async post_add() {
    // 防止重复调用
    const { time, user, content } = this.ctx.request.body;

    const update = await this.ctx.service.dayoff.add({ user, time, content });

    // 增加调休总数
    this.ctx.body = 'success'
  }

  async post_use() {
    // 防止重复调用
    const { time, user, content } = this.ctx.request.body;
    const update = await this.ctx.service.dayoff.use(user, time, content);

    // 增加调休总数
    this.ctx.body = { update };
  }

  /**
   * 同步某用户的打卡信息
   * 请求参数: user的信息
   */
  async post_sync() {
    const { ctx } = this
    const { user } = ctx.request.body
    if (!user) {
      throw {
        code: 10000,
        message: '非法参数',
        data: null
      }
    }
    await ctx.service.checkin.sync(user.userId, user.updateTime)
    ctx.body = "操作成功"
  }

  async get_data() {
    const { user } = this.ctx.query;
    const starttime = moment()
      .subtract(1, 'months')
      .date(1);
    const endtime = moment(starttime).endOf('month');

    const query = {
      openCheckinDataType: 1,
      startTime: format('YYYY-MM-DD 00:00:00')(starttime),
      endTime: format('YYYY-MM-DD 23:59:59')(endtime),
      userIdList: [user]
    };

    const data = await this.service.sso.checkin({
      data: query
    });
    this.ctx.body = (data || []).filter(
      item => item.checkinType === '下班打卡'
    );
  }

  /*
   *  手动更新用户入职时间 （TODO 信息）
   */
  async post_update() {
    const { user, enrollDate } = this.ctx.request.body;
    // 插入增加调休记录
    const { User } = this.ctx.models;

    const update = User.findOneAndUpdate(
      { userId: user },
      { $set: { enrollDate } }
    ).exec();

    this.ctx.body = { update };
  }
};
