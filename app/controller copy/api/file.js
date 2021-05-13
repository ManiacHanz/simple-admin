const Controller = require('egg').Controller;
const STS = require('qcloud-cos-sts');
// const COS = require('xr-cos-node')


module.exports = class UserController extends Controller {
  /**
   * 文件授权 token 获取
   */
  async get_token() {
    const { service } = this.ctx;
    const { authorization, key } = await service.file.auth();
    const { Domain } = this.ctx.helper.config.cos;
    this.ctx.body = { authorization, key, domain: Domain };
  }

  /**
   * 文件列表
   */
  async get_list() {
    const { service, query } = this.ctx;
    const { bucket, name } = query;
    const regMap = ['author', 'url', 'project']
    let params = {};
    regMap.forEach(key => {
      if (query[key]) {
        params[key] = { $regex: new RegExp(query[key]) }
      }
    })
    if (bucket !== undefined) { params['bucket'] = bucket }
    // 临时给一个name的重命名判断，后期上海做了这里可以删掉
    if (name !== undefined) { params['name'] = name }
    const files = await service.file.list(params);
    this.ctx.body = files;
  }

  /**
   * 文件上传
   */
  async post_upload() {
    const { request, state, service } = this.ctx;
    const { url, bucket, project } = request.body;
    if (!url || url.length === 0) {
      throw {
        code: 10000,
        data: null,
        message: '请确认文件地址'
      }
    }
    const { name: author, userId } = state.user;
    const data = { author, url, userId, bucket, project }
    const fileInfo = await service.file.add(data);
    this.ctx.body = fileInfo;
  }

  /* 文件修改 */
  async post_edit() {
    const { request, service } = this.ctx;
    const { _id, ...rest } = request.body;
    const result = await service.file.edit(_id, rest);
    this.ctx.body = result;
  }

  /* 文件删除 */
  async post_delete() {
    const { request, service } = this.ctx;
    const { _id } = request.body;
    const result = await service.file.delete(_id);
    this.ctx.body = result;
  }

  async get_refresh() {
    const cos = this.ctx.helper.getCos();
    const { query } = this.ctx;
    const { url } = query;
    try {
      await cos.refreshUrls([url])
      this.ctx.body = 'success'
    } catch (err) {
      this.ctx.logger.info('文件刷新失败：url等于', url, err)
      this.ctx.body = 'failed'
    }
  }
  /*
   * 获取临时密钥
   */
  async get_cosInfo() {
    const { cos } = this.ctx.helper.config;

    this.ctx.body = {
      tempKey: {
        SecretId: cos.SecretId,
        SecretKey: cos.SecretKey
      },
      cosInfo: {
        BucketName: cos.BucketName,
        Bucket: cos.Bucket,
        Region: cos.Region,
        AppId: cos.AppId
      }
    };
  }
};
