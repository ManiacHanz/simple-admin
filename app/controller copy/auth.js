const Controller = require("egg").Controller;

module.exports = class AuthController extends Controller {
  async index() {
    const { ctx } = this;

    // 获取登录信息
    // 获取权限信息
    const sso = "http://oa.sso.developer.doctorwork.com/console/v1/user/info";

    const { data } = await ctx.curl(sso, {
      dataType: "json",
      headers: {
        cookie: ctx.headers.cookie
      }
    });

    const { data: user = {} } = data;
    if (!user) {
      ctx.status = 200;
      ctx.body = 'ok';
      // TODO: 返回授权地址给nginx 或者 js
      // ctx.set('Location', )
      return
    }

    ctx.set("user", JSON.stringify({
      deptId: user.deptId,
      userId: user.userId,
      mobile: user.mobile,
      id: user.id,
      userType: user.userType
    }));

    ctx.status = 200;
    ctx.body = {
      name: "auth"
    };
  }
};
