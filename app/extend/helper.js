const queryString = require("query-string");
// const COS = require('xr-cos-node')

// const cos = new COS({
//   secret: '6AUfKBjkVsIBeayFVafp7zctDSSbrHla',
//   signOptions: {
//     partnerId: '17'
//   }
// })
const cos = {}

module.exports = {
  queryParse(params = {}, strOpts = {}, parOpts = {}) {
    const defaultStrOpts = {
      skipEmptyString: true,
      skipNull: true,
      encode: false // 不对数组的,转码
    };
    const defaultParOpts = {
      parseNumbers: true,
      parseBooleans: true,
      arrayFormat: "comma"
    };
    const strOptions = { ...defaultStrOpts, ...strOpts };
    const parOptions = { ...defaultParOpts, ...parOpts };
    return queryString.parse(
      queryString.stringify(params, strOptions),
      parOptions
    );
  },
  getCos() {
    return cos
  }
};
