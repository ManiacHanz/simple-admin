const Service = require("egg").Service;
const moment = require("moment");

// 加班申请的service
class OvertimeService extends Service {
  async list(params = {}) {
    const { page, ...rest } = params;
    // const params = userId ? { userId } : {};
    const list = await this.ctx.models.Request
      .paginate(this.ctx.query, rest, {
        populate: { path: "user", select: 'name' }
      });

    return list;
  }

  async write(data) {
    const { date } = data;
    const month = moment(date).format("YYYY-MM");
    const res = this.ctx.models.Request.collection.insert({
      ...data,
      month,
      status: 0
    });
    return res;
  }

  async update(_id, status = 1) {
    const res = this.ctx.models.Request.findOneAndUpdate(
      {
        _id
      },
      {
        $inc: { status }
      }
    );
    return res;
  }

  /* 不需要审批的加班记录 */
  async success(data) {
    const { date } = data;
    const month = moment(date).format("YYYY-MM");
    const res = this.ctx.models.Request.collection.insert({
      ...data,
      month,
      status: 1
    });
    return res;
  }
}

module.exports = OvertimeService;
