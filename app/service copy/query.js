const Service = require("egg").Service;

const except = (data, keys) => Object.keys(data).reduce((pre, cur) => {
    if (!keys.includes(cur)) {
        pre[cur] = data[cur];
    }
    return pre;
}, {})

class LogService extends Service {
    search() {
        const data = this.ctx.method === 'GET' ? this.ctx.query : this.ctx.data;
        return except(data, ['page', 'limit']);
    }
}

module.exports = LogService;
