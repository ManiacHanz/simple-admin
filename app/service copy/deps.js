const Service = require('egg').Service;

class DepsService extends Service {

  async list(query = {}) {
    return await this.ctx.models.DepartmentStatus.find(query)
  }

  async update(data = {}, updater = {}) {
    const { depId } = this.ctx.helper.queryParse(data)
    return await this.ctx.models.DepartmentStatus.update({ depId: { $in: depId } }, updater, { multi: true })
  }

  /* 
   * 从远程拉取部门信息，强行更新表
   */
  async refresh() {
    const originDeps = await this.service.sso.get('departments');
    await this.ctx.models.Department.deleteMany()
    return await this.ctx.models.Department.insertMany(originDeps)
  }
}

module.exports = DepsService;
