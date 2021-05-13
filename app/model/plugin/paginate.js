'use strict';

/**
 * @package mongoose-paginate
 * @param {Object} [query={}]
 * @param {Object} [options={}]
 * @param {Object|String} [options.select]
 * @param {Object|String} [options.sort]
 * @param {Array|Object|String} [options.populate]
 * @param {Boolean} [options.lean=false]
 * @param {Boolean} [options.leanWithId=true]
 * @param {Number} [options.offset=0] - Use offset or page to set skip position
 * @param {Number} [options.page=1]
 * @param {Number} [options.pageSize=10]
 * @param {string} [options.total='total'] 计数
 * @returns {Promise}
 */

function paginate(ctx, query, options) {
  query = query || {};
  options = Object.assign({}, paginate.options, options);
  let select = options.select;
  let sort = options.sort;
  let populate = options.populate;
  let lean = options.lean || false;
  let skip, promises;

  const { totalKey = 'total' } = options;

  const { pageSize = 15, page = 1 } = ctx;
  skip = (page - 1) * pageSize;

  if (pageSize) {
    let docsQuery = this.find(query)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(Number(pageSize))
      // lean 提高性能
      .lean(lean);
    if (populate) {
      [].concat(populate).forEach(item => {
        docsQuery.populate(item);
      });
    }
    promises = {
      docs: docsQuery.exec(),
      count: this.countDocuments(query).exec()
    };
  }
  promises = Object.keys(promises).map(x => promises[x]);
  return Promise.all(promises).then(([list, total]) => {
    let result = {
      list,
      [totalKey]: total
    };

    return Promise.resolve(result);
  });
}

/**
 * @param {Schema} schema
 */

module.exports = function(app) {
  return schema => (schema.statics.paginate = paginate);
};
