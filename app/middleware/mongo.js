module.exports = opts => async (ctx, next) => {

    // 为 model 
    console.log('ctx user', ctx.user);
    await next();

}