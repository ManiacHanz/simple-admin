
const path = require('path')
class App {
  constructor(app) {
    console.log('constructor')
    this.app = app;
  }
  async configDidLoad(){
    console.log('cfgdidload', this.app)
    await this.loadSchema()
  }
  async didLoad() {
    // 请将你的插件项目中 app.beforeStart 中的代码置于此处。
  }

  async willReady() {
    // 请将你的应用项目中 app.beforeStart 中的代码置于此处。
  }
  async didReady() {
    // 应用已经启动完毕
    console.log('didReady')
  }
  async beforeClose() {
    // 请将您的 app.beforeClose 中的代码置于此处。
  }
  async loadSchema() {
    const modelDir = path.join(this.app.baseDir, 'app/model')
    const graphQLDir = path.join(this.app.baseDir, 'app/graphql')

    this.app.loader.loadToApp(modelDir + '/schemas', 'schemas', {
      initializer(model) {
        return model.toString()
      },
      match: '**/*.graphql'
    })
    this.app.schemas = this.app.schemas.schema
  }
}

module.exports = App;
