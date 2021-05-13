module.exports = app => {
  const { router, controller } = app;

  function mountAction(func, ctl, { mount, name }) {
    // 如果是 function 类型 开始注册
    let method, action;
    if (func === 'index') {
      method = 'get';
      action = 'index';
    } else {
      [method, action] = func.match(/^([^_]+)_(.+)/).slice(1);
    }

    let route = action === 'index' ? `${name}` : `${name}/${action}`;
    mount[method](route, ctl[func]);
    console.log("register: ", route)
  }

  function loop(ctl, name, mount) {
    Object.keys(ctl)
      .filter(name => !name.startsWith('_'))
      .forEach(func => {
        //如果是 object 递归 registerAction
        if (typeof (ctl[func]) !== 'function') {
          loop(ctl[func], `${name}/${func}`, mount);
          return
        }
        mountAction(func, ctl, { mount, name });
      })
  }

  Object.keys(controller)
    .filter(name => name !== 'index')
    .forEach(name => loop(controller[name], `/${name}`, router));

  // 确保 index 为最终controller 不是目录
  const index = controller.index;
  if (index) {
    Object.keys(index).forEach(func => mountAction(func, index, { mount: router, name: "" }))
  }
};
