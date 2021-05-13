/* 和拉取打卡时间有关的service */

const Service = require("egg").Service;
const date = require("../utils/date");

class CheckinService extends Service {
  filter_data(list, { workDates = [], restDates = [] }) {

    function isWorkDay(moment, workDates, restDates) {
      const dateStr = moment.format("YYYY-MM-DD")
      const day = moment.day()
      return workDates.includes(dateStr) || (day >= 1 && day <= 5 && !restDates.includes(dateStr))
    }

    const dutyOffData = list.reduce((pre, curr) => {
      // 去掉上班打卡及异常打卡
      if (curr.checkinType === '上班打卡' || curr.exceptionType !== '') return pre

      const endWorkMoment = date.unix(curr.checkinTime)
      const week = endWorkMoment.day()
      const dateStr = endWorkMoment.format('YYYY-MM-DD')
      const yesterday = date.time(date.lastDay(dateStr))

      // 过滤规则2.0
      // 只分上班的日子（1-5 && workDates）和休息的日子（6-0 && restDates）  
      // 须要先判断是否是休息的日子，提前过滤
      // 上班日子凌晨的打卡，且头一天是休息日的打卡，须要过滤掉。算申请加班
      // 休息日凌晨的打卡，头一天如果是休息日，过滤掉
      // 休息日下班打卡 都过滤
      if (isWorkDay(endWorkMoment, workDates, restDates) && endWorkMoment.isBefore(`${dateStr} 04:00:00`)) {
        if (!isWorkDay(yesterday, workDates, restDates)) {
          return pre
        }
      } else if (!isWorkDay(endWorkMoment, workDates, restDates)) {
        if (
          endWorkMoment.isAfter(`${dateStr} 04:00:00`) ||
          (endWorkMoment.isBefore(`${dateStr} 04:00:00`) && !isWorkDay(yesterday, workDates, restDates))
        ) {
          return pre
        }
      }

      // FIXME ?当天的最后一次,已经没有一天多次打卡的情况？
      const result = date.caculateOvertime(endWorkMoment)
      if (!result) return pre

      return [...pre, {
        userId: curr.userId,
        checkinTime: curr.checkinTime,
        diff: result.diff,
        hour: endWorkMoment.format('YYYY-MM-DD HH:mm:ss'),
        minutes: result.overtime
      }]
    }, [])

    return dutyOffData
  }

  /* 
   * 企微限制 这里31天的月分 分成2部分拉
   * 1号早上4点到31号早上3点59  31号早上4点到次月1号3点59
   * 这里可能存在的bug  1号到31号
   */
  async month(time, users) {
    const sso = this.ctx.service.sso;
    const opts = {
      userIdList: users,
      openCheckinDataType: 1
    };

    const days = date.time(time).daysInMonth();

    // 按照 30 天作为分界点  endDay都等于31号当天
    let endDay = ''
    if (days <= 30) {
      endDay = date.nextDay(`${time}-${days}`)
    } else {
      endDay = `${time}-31`
    }

    const parts = [
      sso.checkin({
        data: {
          ...opts,
          startTime: `${time}-01 04:00:00`,
          endTime: `${endDay} 03:59:59`
        }
      })
    ];


    // 判断当月是否有超过30天
    if (days > 30) {
      const nextMonthFirstDay = date.nextDay(`${time}-31`)
      const leftDate = sso.checkin({
        data: {
          ...opts,
          startTime: `${time}-31 04:00:00`,
          endTime: `${nextMonthFirstDay} 03:59:59`
        }
      });
      parts.push(leftDate);
    }

    const checkindata = await Promise.all(parts);

    const specialDates = await this.ctx.service.date.getAll()

    const list = this.filter_data(
      [].concat.apply([], checkindata.filter(Boolean)),
      specialDates
    );

    return { time, list };
  }

  async year(month, users) {
    const now = month ? date.time(month) : date.now();
    const months = date.format("M")(now);
    const year = date.format("YYYY")(now);

    const m = Array.from({ length: months }, (x, i) => i + 1);

    const data = m.map(month => {
      return this.month(`${year}-${month.toString().padStart(2, 0)}`, users);
    });

    return await Promise.all(data);
  }

  async day(day, userId, endDay, notFilter) {
    const sso = this.ctx.service.sso;
    const opts = {
      userIdList: typeof userId === 'string' ? [userId] : userId,
      openCheckinDataType: 1
    };
    const nextDay = endDay ? endDay : date.nextDay(day);
    const checkindata = await sso.checkin({
      data: {
        ...opts,
        startTime: `${day} 04:00:00`,
        endTime: `${nextDay} 03:59:59`
      }
    });
    // 周末的接口不按平时去过滤
    if (notFilter) return checkindata

    const specialDates = await this.ctx.service.date.getAll()

    const list = this.filter_data(
      [].concat.apply([], checkindata.filter(Boolean)),
      specialDates
    );
    return { list };
  }


  // 以天的时间单位 安排企微请求
  async days(startDay, userId, endDay) {
    const { ctx } = this
    const size = 30
    const sso = ctx.service.sso;
    const end = endDay ? endDay : +new Date()
    const diffs = date.diff(startDay, end)
    const length = Math.ceil(diffs / size)
    const daysArr = Array.from({ length }, (v, i) => ({
      start: date.nextDay(startDay, size * i),
      end: i === length - 1 ? date.format("YYYY-MM-DD")(date.time(end)) : date.nextDay(startDay, size * (i + 1))
    }))

    if (daysArr.length === 0) return

    const proms = daysArr.map(item => ctx.service.checkin.day(item.start, userId, item.end))
    const result = await Promise.all(proms)

    return result
  }

  // 同步个人时间
  async sync(userId, startFrom, userDepId) {
    let map = {}   // 记录userId对应部门id的缓存
    const { ctx } = this
    const start = startFrom ? startFrom : '2020-01-01'
    const result = await ctx.service.checkin.days(start, userId)

    // 给userDepId做个兼容
    if (!userDepId) {
      const [userinfo] = await ctx.models.User.find({ userId }, { _id: 0, departmentId: 1 })
      userDepId = userinfo.departmentId
    }

    if (!result) return

    // 存Synclog 避免重复
    const logs = result.reduce((pre, curr) => {
      const list = curr.list
      return [...pre, ...list]
    }, [])

    // 拼装写入数据库的documents
    const documents = logs.map(log => {
      const m = date.time(log.hour)
      const checkin_date = date.isMorning(m)
        ? date.lastDay(log.hour)
        : m.format('YYYY-MM-DD')
      return {
        _id: { userId: log.userId, checkinTime: log.checkinTime },
        minutes: log.minutes,
        hour: log.hour,
        checkin_date,
        department: userDepId
      }
    })

    await ctx.service.dayoff.autoAdd(documents)


  }
}

module.exports = CheckinService;
