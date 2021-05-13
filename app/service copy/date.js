/* 和拉取打卡时间有关的service */

const Service = require("egg").Service;

class DateService extends Service {
  async validate(dateStr) {
    const result = await this.ctx.models.SpecialDate.find({ _id: dateStr })

    if (result.length > 0 && result[0].isSpecial === 1) {
      throw {
        code: 10000,
        message: '该天为节假日正常补班，请核实',
        data: null
      }
    }
  }
  async getAll() {
    const result = await this.ctx.models.SpecialDate.find({})
    return result.reduce((pre, curr) => {
      if (curr.isSpecial === 1) pre['workDates'].push(curr._id)
      else pre['restDates'].push(curr._id)

      return pre
    }, { workDates: [], restDates: [] })
  }
}

module.exports = DateService;
