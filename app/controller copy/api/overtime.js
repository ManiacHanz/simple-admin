const Controller = require('egg').Controller;
const moment = require('moment');
const date = require('../../utils/date');

module.exports = class OvertimeController extends Controller {
  async get_list() {
    const { query = {} } = this.ctx;

    let params = this.ctx.helper.queryParse(query);
    if (params.name) {
      const reg = new RegExp(params.name);
      const userList = await this.ctx.models.User.find({ name: { $regex: reg } });
      const userIds = userList.map(user => user.userId)
      Object.assign(params, { name: { $in: userIds } })
    }

    const list = await this.ctx.service.overtime.list(params);

    this.ctx.body = { ...list };
  }

  // 获取用户自己的加班申请列表
  async get_ownlist() {
    const { ctx } = this;

    const { userId } = ctx.state;

    // TODO 需不需要给默认的当前月份
    const { query = {} } = ctx;
    const params = ctx.helper.queryParse(Object.assign({ userId }, query));

    const list = await this.ctx.service.overtime.list(params);
    this.ctx.body = { ...list };
  }

  /* 加班记录申请换成调休时间 */
  async post_apply() {
    const { userId } = this.ctx.state
    const { dateStr } = this.ctx.request.body;

    const result = await this.ctx.service.checkin.day(dateStr, userId, false, true);

    let [startWork, endWork] = result.reduce(
      (pre, curr) => {
        if (curr.exceptionType === '') {
          if (curr.checkinType === '上班打卡') pre[0] = curr;
          if (curr.checkinType === '下班打卡') pre[1] = curr;
        }
        return pre;
      },
      [undefined, undefined]
    );
    if (!startWork || !endWork) {
      throw {
        code: 10000,
        message: '无打卡信息或打卡异常，请核实',
        data: null
      };
    }

    // 返回日期，星期，上下班打卡时间
    const check = {
      checkinTime: [startWork.checkinTime, endWork.checkinTime],
      startTime: date.unix(startWork.checkinTime).format('HH:mm'),
      endTime: date.unix(endWork.checkinTime).format('HH:mm'),
      date: dateStr,
      week: date.day(dateStr)
    };

    const doc = await this.ctx.models.Request.find({ userId, checkinTime: check.checkinTime })

    if (doc && doc.length) {
      throw {
        code: 10000,
        message: '当天加班已申请，请核实',
        data: null
      };
    }

    await this.ctx.service.overtime.write({
      ...check,
      userId
    });

    this.ctx.body = 'success'
  }

  /* 审批加班记录 */
  async post_approve() {
    const { userId, _id } = this.ctx.request.body;

    // 先找一下有没有同步记录
    const doc = await this.ctx.models.Request.find({ _id })
    const { checkinTime: [startUnix, endUnix] } = doc[0]

    const log = await this.ctx.models.Synclog.find({ "_id.userId": userId, "_id.checkinTime": endUnix })

    if (log && log.length) {
      throw {
        code: 10000,
        message: '当天加班记录已同步，请勿重复通过',
        data: null
      };
      return
    }

    const result = await this.ctx.service.overtime.update(_id, 1);
    const dateStr = moment(result.date).format('YYYY-MM-DD');
    const stm = moment(`${dateStr} ${result.startTime}`);
    const etm = moment(`${dateStr} ${result.endTime}`);

    const diff = etm.diff(stm, 'minutes');
    const minutes = Math.floor(diff / 30) * 30
    const hours = minutes / 60;

    const content = `${dateStr}加班申请审批通过`;

    const [userinfo] = await this.ctx.models.User.find({ userId })
    const userDepId = userinfo.departmentId

    const documents = [{
      _id: { userId, checkinTime: endUnix },
      minutes: minutes,
      hour: date.unix(endUnix).format('YYYY-MM-DD HH:mm:ss'),
      checkin_date: date.unix(endUnix).format('YYYY-MM-DD'),
      department: userDepId
    }]
    await this.ctx.service.dayoff.autoAdd(documents)

    await this.ctx.service.dayoff.add({ user: userId, time: hours, handle: 'overwork' }, true);

    this.ctx.body = 'success'
  }

  async post_deny() {
    const { userId, _id } = this.ctx.request.body;

    const result = await this.ctx.service.overtime.update(_id, 2);
    this.ctx.body = {
      message: 'success'
    };
  }

  /* 不需要审批的加班申请 */
  async post_dirApply() {
    const { userId } = this.ctx.state
    const { dateStr } = this.ctx.request.body;

    // 看dataStr是否是特殊补班日期
    await this.ctx.service.date.validate(dateStr)

    const result = await this.ctx.service.checkin.day(dateStr, userId, false, true);

    let startWork, endWork
    // 上班时间拉第一次，下班时间拉最后一次
    startWork = result.find(item => item.exceptionType === '' && item.checkinType === '上班打卡')
    endWork = result.reduce(
      (pre, curr) => {
        if (curr.exceptionType === '') {
          if (curr.checkinType === '下班打卡') pre = curr;
        }
        return pre;
      },
      {}
    );

    if (!startWork || !endWork) {
      throw {
        code: 10000,
        message: '无打卡信息或打卡异常，请核实',
        data: null
      };
    }

    // 返回日期，星期，上下班打卡时间
    const check = {
      checkinTime: [startWork.checkinTime, endWork.checkinTime],
      startTime: date.unix(startWork.checkinTime).format('HH:mm'),
      endTime: date.unix(endWork.checkinTime).format('HH:mm'),
      date: dateStr,
      week: date.day(dateStr)
    };

    const doc = await this.ctx.models.Request.find({ userId, checkinTime: check.checkinTime })

    if (doc && doc.length) {
      throw {
        code: 10000,
        message: '当天加班已申请，请核实',
        data: null
      };
    }

    // 先找一下有没有同步记录
    const log = await this.ctx.models.Synclog.find({ "_id.userId": userId, "_id.checkinTime": endWork.checkinTime })

    if (log && log.length) {
      throw {
        code: 10000,
        message: '当天加班记录已同步，请勿重复通过',
        data: null
      };
      return
    }

    await this.ctx.service.overtime.success({
      ...check,
      userId
    });

    const [userinfo] = await this.ctx.models.User.find({ userId })
    const userDepId = userinfo.departmentId

    const stm = moment(date.unix(startWork.checkinTime));
    const etm = moment(date.unix(endWork.checkinTime));

    const diff = etm.diff(stm, 'minutes');
    const minutes = Math.floor(diff / 30) * 30
    const hours = minutes / 60;

    const content = `${dateStr}加班申请审批通过`;

    const documents = [{
      _id: { userId, checkinTime: endWork.checkinTime },
      minutes: minutes,
      hour: date.unix(endWork.checkinTime).format('YYYY-MM-DD HH:mm:ss'),
      checkin_date: date.unix(endWork.checkinTime).format('YYYY-MM-DD'),
      department: userDepId
    }]
    await this.ctx.service.dayoff.autoAdd(documents)

    await this.ctx.service.dayoff.add({ user: userId, time: hours, handle: 'overwork' }, true);

    this.ctx.body = 'success'
  }

  /* 测试时间 */
  async get_test() {
    const { userId, day, end } = this.ctx.query;
    const result = await this.ctx.service.checkin.day(day, userId, end, true);
    this.ctx.body = { result };
  }
  /* 测试  勿用 */
  async get_remove() {
    const { confirm, collection } = this.ctx.query;
    if (confirm == 'true') {
      this.ctx.models[collection].remove({}).exec();
    }
    this.ctx.body = {};
  }
};
