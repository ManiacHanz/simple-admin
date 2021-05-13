const path = require('path');

const MONGO_URL = process.env.MONGO_URL || '127.0.0.1:27017/egg-admin';

module.exports = app => {
  // mongodb 服务
  const dbclients = {
    db1: {
      // 单机部署
      url: `mongodb://${MONGO_URL}`,
      options: {
        // autoReconnect: true,
        poolSize: 5,
        useFindAndModify: false,
        useUnifiedTopology: true
      }
    }
  };

  return {
    // middleware: ['response', 'user'],
    keys: 'node-eggj-keys',
    runtime: {
      start: process.env.OVERTIME_START || 19 // 24小时制加班起算时间
    },
    // logger: {
    //   dir: path.join(app.baseDir, 'logs'),
    //   level: 'DEBUG',
    //   consoleLevel: 'DEBUG',
    //   // prod debug
    //   allowDebugAtProd: true
    // },
    // user: {
    //   redirect_uri: process.env.AUTH_REDIRECT,
    //   sphinxUrl: process.env.SPHINX_URL
    // },
    security: {
      csrf: {
        enable: false
        // headerName: 'x-csrf-token', // 自定义请求头
        // 判断是否需要 ignore 的方法，请求上下文 context 作为第一个参数
        // ignore: ctx => ctx.path.match(/graphi?ql/),
      }
    },
    sso: {
      // url: "oa-sso-web"
      url: process.env.SSO_URL || 'oa-sso-web'
    },
    mongoose: {
      clients: dbclients
    },
    // onerror: {
    //   all(err, ctx) {
    //     // 在此处定义针对所有响应类型的错误处理方法
    //     // 注意，定义了 config.all 之后，其他错误处理方法不会再生效
    //     ctx.logger.info('global error: ', err);
    //   },
    //   json(err, ctx) {
    //     // json hander
    //     ctx.body = { message: 'error' };
    //     ctx.status = 500;
    //   }
    // },
  };
};

