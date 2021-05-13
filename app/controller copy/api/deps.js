const Controller = require('egg').Controller;

module.exports = class DepController extends Controller {
  async get_list() {
    // TODO 这个list应该不去拉远程的数据，只拉本地的数据
    const originDeps = await this.ctx.models.Department.find({})
    // 做增量检查
    const { originIds, originMaps } = originDeps.reduce((pre, curr) => {
      pre.originIds.push(curr.id)
      pre.originMaps[curr.id] = curr
      return pre
    }, { originIds: [], originMaps: {} })
    // 获取本地部门数据
    const localDeps = await this.ctx.models.DepartmentStatus.find({ depId: { $in: originIds } });
    const { localIds, localMaps } = localDeps.reduce((pre, curr) => {
      pre.localIds.push(curr.depId)
      pre.localMaps[curr.depId] = curr
      return pre
    }, { localIds: [], localMaps: {} })

    const insertIdSets = new Set([...originIds, ...localIds].filter(id => !localIds.includes(id)))
    const insertIds = Array.from(insertIdSets)

    // const removeIdSets = new Set([...originIds, ...localIds].filter(id => !originIds.includes(id)))
    // const removeIds = Array.from(removeIdSets)

    const diff = insertIds.map(id => ({ depId: id }))

    // 保存到数据库
    // await this.ctx.models.Department.remove({ id: { $in: removeIds } })
    await this.ctx.models.DepartmentStatus.insertMany(diff)
    // TODO  填充需要改成单字段 只需要active  
    const departments = await this.ctx.models.Department.find({}).populate({ path: 'status', select: 'active -_id -depId' })

    this.ctx.body = departments;
  }

  async get_refresh() {
    // 从远程拉取并更新部门列表
    // TODO 这里应该放到service里面，然后看后面是定时更新还是如何，尽量少调用
    const result = await this.service.deps.refresh()

    this.ctx.body = result
  }

  async post_enable() {
    const data = this.ctx.request.body

    const result = await this.service.deps.update(data, { active: 1 })
    this.ctx.body = result
  }

  async post_disable() {
    const data = this.ctx.request.body

    const result = await this.service.deps.update(data, { active: 0 })
    this.ctx.body = result
  }

  // 旧
  async get_enable() {
    const { dep_id } = this.ctx.query;
    const userlist = await this.service.sso.departmentUser(dep_id);

    const insert = userlist.map(item => {
      const department = item.mainDepartment;
      const { position, userId, name, isLeader } = item;

      return {
        position,
        userId,
        name,
        departmentId: department || dep_id,
        isLeader
      };
    });

    insert.forEach(async user => {
      const { userId, position,
        name,
        departmentId,
        isLeader } = user
      await this.ctx.models.User.findOneAndUpdate(
        { userId },
        { $set: { userId, name, departmentId, isLeader, position } },
        { upsert: true }
      )
    })

    this.ctx.body = {
      count: insert.length,
      insert
    };
  }

  async get_users() {
    const { dep_id = 1 } = this.ctx.query;
    const userlist = await this.ctx.models.User.find({});
    this.ctx.body = userlist;
  }

  async get_oausers() {
    const { dep_id } = this.ctx.query;
    const userlist = await this.ctx.service.sso.departmentUser(dep_id);
    this.ctx.body = userlist;
  }
};
