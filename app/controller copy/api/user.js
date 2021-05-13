const Controller = require("egg").Controller;
const date = require("../../utils/date");

const roleAlias = name => (name === "dayoff管理员" ? "admin" : "user");

const nextTwoDay = 24 * 60 * 60 * 1000
module.exports = class UserController extends Controller {
  async get_info() {
    const { ctx } = this;
    const userId = ctx.state.user.userId;
    const avatar = ctx.state.user.avatar;
    let user = await this.ctx.models.User.findOne({ userId }, { _id: 0 })
    const expirationTime = user ? user.expirationTime : 0
    const now = +new Date()
    if (!user || !expirationTime || now > expirationTime) {
      // TODO 重写UserService.info方法
      user = await ctx.service.users.info()
      await ctx.models.User.findOneAndUpdate(
        { userId },
        {
          $set: {
            name: user.name,
            userId: user.userId,
            deptName: user.deptName,
            departmentId: user.qyDepId,
            position: user.position,

            // departmentId: user.qyDepId,
            // qyDepId: user.qyDepId,  // 企微的正常depId
            expirationTime: now + nextTwoDay
          }
        },
        { upsert: true }
      )
    }
    const userDepId = user.qyDepId || user.departmentId
    // 同步打卡及加班时间
    await ctx.service.checkin.sync(userId, user.updateTime, userDepId)

    const [userinfo, roles] = await Promise.all([
      this.ctx.models.User.findOne({ userId }, { _id: 0 }).populate("department", { _id: 0, parentId: 0 }).lean(true).exec(),
      this.service.user.access("dayoff")
    ]);

    const [role] = roles || [{}];

    ctx.body = {
      ...userinfo,
      avatar,
      role: role ? roleAlias(role.roleName) : "user"
    };
  }

  async index() {
    const users = await this.service.user.access();
    this.ctx.body = users;
  }

  async get_overtime() {
    const { ctx } = this;
    const userId = ctx.state.user.userId;
    const [user, documents] = await Promise.all([
      await this.ctx.models.User.find({ userId }),
      await this.ctx.models.Synclog.find({ "_id.userId": userId })
    ])
    // 聚合成 按月划分的 [{time: monthStr, list: [...record]}] 格式
    const o = documents.reduce((pre, curr) => {
      const month = date.format('YYYY-MM')(date.time(curr.hour))
      pre[month] = pre[month] ? [...pre[month], curr] : [curr]
      return pre
    }, {})
    const checkindata = Object.entries(o).map(item => ({ time: item[0], list: item[1] }))
    this.ctx.body = {
      user,
      checkindata
    };
  }



  /**
   * 注销接口
   */
  async get_logout() {
    this.ctx.cookies.set("loginToken", "", {
      expire: -1
    });
  }

  /**
   * 获取其他工作信息
   */
  async get_dash() {
    // 获取面试
    const user = await this.ctx.service.gateway.get('/interview/interviewer/current-info');
    if (!user || !user.id) {
      this.ctx.body = {
        list: []
      };
      return
    }
    const { list } = await this.ctx.service.gateway.get('/interview/interview/search/1/100?interviewerId=' + user.id);
    this.ctx.body = {
      list
    }
  }





  // 老版本 从企微去拉的
  // async get_overtime2() {
  //   // 查询用户 id
  //   const { userId, month } = this.ctx.query;
  //   // todo: findone
  //   const [user] = await this.ctx.models.User
  //     .find({ userId })
  //     .exec();

  //   let list;
  //   if (month) {
  //     list = await this.ctx.service.checkin.month(month, [user.userId]);
  //   } else {
  //     list = await this.ctx.service.checkin.year(undefined, [user.userId]);
  //   }

  //   this.ctx.body = {
  //     user,
  //     checkindata: list
  //   };
  // }
};
