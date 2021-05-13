const Service = require('egg').Service;
const moment = require('moment');

const format = time => time.format('YYYY-MM-DD HH:mm');

class LogService extends Service {
  async write(data) {
    const now = moment();
    const date = format(now);
    const month = now.format('YYYY-MM');
    const { Log } = this.ctx.models;

    const log = Log.collection.insertOne({
      operator: this.ctx.state.user.userId,
      ...data,
      date,
      month,
      created_at: date
    });

    return log;
  }

  async list(params) {
    const { user: target, ...rest } = params;
    const logs = await this.ctx.models.Log.aggregate([
      {
        $match: { target, ...rest }
      }
    ]);
    return logs;
  }
}

module.exports = LogService;
