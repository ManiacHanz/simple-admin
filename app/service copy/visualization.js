const Service = require("egg").Service;

class VisualizationService extends Service {

    // 列表
    async list(params = {}) {
        const { models: { Visualization }, query } = this.ctx;
        // 对外暴露的参数名称叫pageSize,pageNo，方便和其他项目接口统一
        query.page = query.pageNo?query.pageNo:1;
        if (!query.pageSize) {
            query.pageSize = 10;
        }
        const list = await Visualization.paginate(query, params, { sort: { creatTime: -1 } })
        return list;
    }

    /**
     * 修改配置
     * @param {string} _id 
     * @param {object} rest 
     */
     async detail(_id) {
        const { Visualization } = this.ctx.models;
        try {
            const res = await Visualization.findOne({ _id })
            return res;
        } catch (err) {
            throw {
                code: 10000,
                message: '编辑保存出错',
                data: null
            }
        }
    }

    /**
     * 新增
     * @param {object} data 
     */
    async write(data) {
        const res = this.ctx.models.Visualization.collection.insertOne({
            ...data
        });
        return res;
    }

    /**
     * 修改配置
     * @param {string} _id 
     * @param {object} rest 
     */
    async update(_id, rest) {
        const { Visualization } = this.ctx.models;
        try {
            const res = await Visualization.findOneAndUpdate({ _id }, { ...rest })
            return res;
        } catch (err) {
            throw {
                code: 10000,
                message: '编辑保存出错',
                data: null
            }
        }
    }

    /**
     * 删除，修改当前记录的状态
     * @param {string} _id 
     */
    async delete(_id) {
        const { Visualization } = this.ctx.models;
        try {
            const res = await Visualization.findOneAndUpdate({ _id }, { status: 0 })
            return res;
        } catch (err) {
            throw {
                code: 10000,
                message: '删除出错了',
                data: null
            }
        }
    }
}
module.exports = VisualizationService