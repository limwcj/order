module.exports = app => {
  return async (ctx, next) => {
    // console.log('packet:', ctx.packet);
    await next();
  };
};
