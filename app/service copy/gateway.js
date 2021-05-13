const Service = require("egg").Service;

const base = process.env.GATEWAY_URL || 'sword-gateway-server';
const gateway = (url) => base + url;

module.exports = class LogService extends Service {

    result(response) {
        return response.data.data;
    }

    request(url, opts) {
        opts.headers = {
            cookie: this.ctx.headers.cookie
        };
        opts.dataType = 'json';
        return this.ctx.curl(gateway(url), opts).then(this.result);
    }

    get(url, data, opts) {
        return this.request(url, { data });
    }

    post(url, data, opts) {
        return this.request(url, {
            data,
            method: 'POST'
        })
    }
}