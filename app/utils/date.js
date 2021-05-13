const moment = require("moment");

const BEGINING = '2020-01'   // 设置初始月份

module.exports = {
  monthRange() {
    const starttime = moment()
      .subtract(1, "months")
      .date(1);
    const endtime = moment(starttime).endOf("month");

    return [starttime, endtime];
  },
  format(type) {
    return date => date.format(type);
  },
  unix(time) {
    return moment.unix(time);
  },
  base(time, diff = {}) {
    return Object.keys(diff).reduce((pre, cur) => {
      return pre[cur](diff[cur]);
    }, moment(time));
  },
  time(str) {
    return moment(str);
  },
  now() {
    return moment();
  },
  day(str) {
    return moment(str).day();
  },
  nextDay(str, step = 1) {
    return moment(str)
      .add(step, "days")
      .format("YYYY-MM-DD");
  },
  lastDay(str) {
    return moment(str).subtract(1, 'days').format('YYYY-MM-DD')
  },
  diff(start, end, step = 'day') {
    return moment(end).diff(moment(start), step)
  },
  caculateOvertime(checkinTime) {
    const momentTime = moment(checkinTime)
    const date = momentTime.format('YYYY-MM-DD')
    const time = momentTime.format('HH:mm:ss')
    const baseline = '21:00:00'
    const midnight = '24:00:00'
    const dawn = '04:00:00'

    let diff = 0
    if (momentTime.isBetween(`${date} ${baseline}`, `${date} ${midnight}`)) {
      diff = momentTime.diff(`${date} ${baseline}`, 'minutes')
    } else if (momentTime.isBefore(`${date} ${dawn}`)) {
      diff = momentTime.diff(moment(`${date} 00:00:00`), 'minutes') + 180
    }

    let overtime = Math.floor(diff / 30) * 30

    return overtime ? { diff, overtime } : false
  },
  countMonths(begin) {
    const start = begin ? begin : BEGINING
    const diff = moment().diff(moment(start), 'month')
    const monthArr = []
    // 这里多一位是因为要把当前月份算进去
    for (let i = 0; i <= diff; i++) {
      monthArr.push(moment(start).add(i, 'month').format('YYYY-MM'))
    }
    return monthArr
  },
  // 是否是凌晨
  isMorning(m) {
    const dateStr = m.format('YYYY-MM-DD')
    return m.isBefore(`${dateStr} 04:00:00`)
  }
};
