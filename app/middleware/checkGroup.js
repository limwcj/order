module.exports = () => {
  return async function checkGroup(ctx, next) {
    if (!ctx.request.body.groupId) return ctx.body = {code: -1, message: '参数错误！'};
    let checkResult = await ctx.service.group.checkUserBelongsGroup(ctx.session.userId, ctx.request.body.groupId);
    if (!checkResult.length) return ctx.body = {code: -1, message: '你还不是该饭团的成员哦！'};
    await next();
  }
};
