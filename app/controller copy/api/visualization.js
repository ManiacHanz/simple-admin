const Controller = require("egg").Controller;

const projectInfo = {
    '1': '家庭医生',
    '2': '硬件运营系统',
    '3': '城市化合伙人',
    '4': '绿通',
    '5': '开放平台',
}

module.exports = class VisualizationController extends Controller {

    /**
     * 列表
     */
    async get_list() {
        const { service, query } = this.ctx;
        const { projectKey, name } = query;
        // 只返回status为1的数据
        const params = {
            status: 1,
        }
        if (projectKey) {
            params.projectKey = projectKey
        }
        if (name) {
            params.name = name
        }
        const list = await service.visualization.list(params);
        this.ctx.body = list;
    }
    /**
     * 详情
     */
    async get_detail() {
        const { service, query } = this.ctx;
        const { _id } = query;
        if (!_id) {
            throw {
                code: 10000,
                message: '缺少参数',
                data: null
            }
        }
        const res = await service.visualization.detail(_id);
        this.ctx.body = res;
    }
    /**
     * 添加
     */
    async post_add() {
        const { service, request } = this.ctx;
        const { projectKey, content, name, userId, userName, desc } = request.body;
        if (!projectKey || !content || !name || !userId || !userName) {
            throw {
                code: 10000,
                message: '缺少参数',
                data: null
            }
        }
        const projectName = projectInfo[projectKey]
        const params = {
            projectKey, projectName, content, name, userId, desc,userName,
            creatTime: new Date().getTime(),
            updateTime: new Date().getTime(),
            status: 1,
        }
        const res = await service.visualization.write(params);
        this.ctx.body = res;
    }

    /**
     * 修改
     */
    async post_edit() {
        const { request, service } = this.ctx;
        const { _id, projectKey, content, name, userId,userName, desc } = request.body;
        if (!_id||!projectKey || !content || !name || !userId || !userName) {
            throw {
                code: 10000,
                message: '缺少参数',
                data: null
            }
        }
        const params = {
            projectKey, content, name, userId, desc,userName,
            updateTime: new Date().getTime(),
        }
        const result = await service.visualization.update(_id, params);
        this.ctx.body = result;
    }
    /**
     * 删除
     */
    async post_delete() {
        const { request, service } = this.ctx;
        const { _id } = request.body;
        if (!_id) {
            throw {
                code: 10000,
                message: '缺少参数',
                data: null
            }
        }
        const result = await service.visualization.delete(_id);
        this.ctx.body = result;
    }
}