const Service = require('egg').Service;
const crypto = require('crypto');

class FileService extends Service {
  // 上传文件
  async add(data) {
    const { File } = this.ctx.models;
    try {
      const { url, ...rest } = data
      const docs = url.map(u => ({ url: u, ...rest, created: +new Date() }))
      const result = await File.collection.insertMany(docs)
      return {}
    } catch (err) {
      throw {
        code: 10000,
        message: '上传出错',
        data: null
      }
      // this.ctx.throw(400, '上传出错')
    }
  }

  async edit(_id, rest) {
    const { File } = this.ctx.models;
    try {
      await File.findOneAndUpdate({ _id }, { ...rest })
      return {}
    } catch (err) {
      // this.ctx.throw(400, '编辑保存出错')
      throw {
        code: 10000,
        message: '编辑保存出错',
        data: null
      }
    }
  }

  async delete(_id) {
    const { File } = this.ctx.models;
    const info = await File.remove({ _id });
    return info;
  }
  // 文件列表
  async list(params = {}) {
    const { models: { File }, query } = this.ctx;
    const list = await File.paginate(query, params, { sort: { created: -1 } })
    return list;
  }

  // 签名
  async auth() {
    const author = this.ctx.state.user.userId;
    // 1
    const startTimestamp = parseInt(+new Date() / 1000);
    const endTimestamp = startTimestamp + 60 * 5;
    const keyTime = `${startTimestamp};${endTimestamp}`;

    // 2
    const signKey = crypto
      .createHmac('sha1', this.config.cos.SecretKey)
      .update(`${keyTime}`)
      .digest('hex');

    // 文件名
    const key = crypto
      .createHash('sha1')
      .update(`${+new Date()}${author}${Math.random()}`)
      .digest('hex');

    // 4
    // TODO:
    const httpParameters = '';
    const httpHeaders = '';
    const method = 'PUT'; // 请求方法这里暂时上传使用默认的 PUT

    // 5
    const httpString = `${method}\n/${key}\n${httpParameters}\n${httpHeaders}\n`.toLocaleLowerCase();

    // 6
    const httpStringSignKey = crypto
      .createHash('sha1')
      .update(`${httpString}`)
      .digest('hex');
    const stringToSign = `sha1\n${keyTime}\n${httpStringSignKey}\n`;

    // 7
    const signature = crypto
      .createHmac('sha1', signKey)
      .update(`${stringToSign}`)
      .digest('hex');

    // 8 authorization
    const authorization = `q-sign-algorithm=sha1&q-ak=${this.config.cos.SecretId}&q-sign-time=${keyTime}&q-key-time=${keyTime}&q-header-list=&q-url-param-list=&q-signature=${signature}`;
    return {
      authorization,
      key
    };
  }
}

module.exports = FileService;
