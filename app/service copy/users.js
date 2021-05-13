const Service = require("egg").Service;

/**
 * 筛选指定键值
 */
const pick = (keys, obj) =>
  keys.reduce((pre, cur) => {
    pre[cur] = obj[cur];
    return pre;
  }, {});

class UsersService extends Service {
  constructor(ctx) {
    super(ctx);
    this.server = ctx.app.config.sso.url + "/v1";
  }

  /**
   * 实际的请求接口
   * @param {string} url 
   * @param {*} withResponse 
   */
  async request(url, withResponse) {
    const response = await this.ctx.curl(this.server + url, {
      dataType: "json",
      headers: {
        cookie: this.ctx.headers.cookie
      },
      contentType: 'json'
    });

    const { errcode, errmsg } = response.data;
    // 
    if (errcode) {
      console.log("ERROR: ", errcode, errmsg)
    }
    return response.data;
  }

  /**
   * 获取用户信息
   */
  async info() {
    // 如果 cookie 不存在，则跳过直接获取
    const { data = {} } = await this.request("/user/info");

    if (data) {
      return data
    }

    return false;
  }

  /**
   * 获取当前用户指定应用权限
   * @param {string} app sso应用名称
   */
  async access(app) {
    const res = await this.request(`/permission/role/my/roles/${app}`);
    return res.data;
  }
}

module.exports = UsersService;