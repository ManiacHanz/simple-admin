const { app, mock, assert } = require('egg-mock/bootstrap');
const moment = require('moment')

const times = [
  '2020-09-10 20:30:00',   // 周四正常下班   过滤
  '2020-09-10 21:45:00',   // 周四加班30分钟  计算结果  √
  '2020-09-11 03:00:00',   // 周4加班360分钟   计算结果  √
  '2020-09-11 21:10:00',   // 周五正常下班   过滤
  '2020-09-12 03:00:00',   // 周五加班360分钟    计算结果  √
  '2020-09-12 19:00:00',   // 周六加班  需要单独申请  过滤
  '2020-09-13 03:00:00',   // 周六加班全天通宵  需要单独申请  过滤
  '2020-09-13 19:00:00',   // 周日加班  需要单独申请  过滤
  '2020-09-14 03:00:00',   // 周日加班通宵  需要单独申请  过滤
  '2020-09-14 19:00:00',   // 周一正常下班   过滤
  '2020-09-14 21:45:00',   // 周一加班30分钟  计算结果   √
  '2020-10-10 03:00:00',   // 特殊补班凌晨下班，  √
  '2020-10-10 19:45:00',   // 补班日期正常下班 过滤
  '2020-10-10 21:45:00',   // 补班日期补班40分钟  计算结果  √
  '2020-05-01 03:00:00',   // 休息日期凌晨打卡 加班360  计算结果  √
  '2020-05-01 21:45:00',   // 休息日期下班打卡  过滤
  '2020-05-02 03:00:00',   // 休息日期凌晨打卡，需申请  过滤
]


const specialDays = { workDates: ['2020-10-10'], restDates: ['2020-05-01', '2020-05-02'] }

const answer = [
  {
    userId: 'admin@doctorwork.com',
    checkinTime: 1599745500,
    diff: 45,
    hour: '2020-09-10 21:45:00',
    minutes: 30
  },
  {
    userId: 'admin@doctorwork.com',
    checkinTime: 1599764400,
    diff: 360,
    hour: '2020-09-11 03:00:00',
    minutes: 360
  },
  {
    userId: 'admin@doctorwork.com',
    checkinTime: 1599850800,
    diff: 360,
    hour: '2020-09-12 03:00:00',
    minutes: 360
  },
  {
    userId: 'admin@doctorwork.com',
    checkinTime: 1600091100,
    diff: 45,
    hour: '2020-09-14 21:45:00',
    minutes: 30
  },
  {
    userId: 'admin@doctorwork.com',
    checkinTime: 1602270000,
    diff: 360,
    hour: '2020-10-10 03:00:00',
    minutes: 360
  },
  {
    userId: 'admin@doctorwork.com',
    checkinTime: 1602337500,
    diff: 45,
    hour: '2020-10-10 21:45:00',
    minutes: 30
  },
  {
    userId: 'admin@doctorwork.com',
    checkinTime: 1588273200,
    diff: 360,
    hour: '2020-05-01 03:00:00',
    minutes: 360
  }
]

const obj = {
  userId: 'admin@doctorwork.com',
  exceptionType: ''
}

const list = Array.from(times, (t) => ({
  ...obj,
  checkinTime: moment(t).unix()
}))

describe('test service/checkin.js ', () => {
  it('should filter data', async () => {
    // 创建 ctx
    const ctx = app.mockContext();
    const result = await ctx.service.checkin.filter_data(list, specialDays);
    console.log(28, result)
    assert(result.length === 7)
    assert(JSON.stringify(result) === JSON.stringify(answer))
  })
});