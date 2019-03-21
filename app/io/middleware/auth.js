'use strict';

async function connect(ctx, app) {
  if (!ctx.session || !ctx.session.userId) return ctx.socket.disconnect();
  const query = ctx.socket.handshake.query;
  const room = query.room;
  const id = ctx.socket.id;
  if (!room) return ctx.socket.disconnect();
  let checkResult = await ctx.service.group.checkUserBelongsGroup(ctx.session.userId, room);
  if (!checkResult || !checkResult.length) return ctx.socket.disconnect();

  ctx.socket.join(room);
  let user = await app.redis.get(`${app.config._io.PREFIX_ONLINE}:${room}:${ctx.session.userId}`);
  await app.redis.set(`${app.config._io.PREFIX_ONLINE}:${room}:${ctx.session.userId}`, JSON.stringify({connectTime: Date.now(), socketId: id}), 'EX', 4 * 3600);
  if (user) return;
  console.log(ctx.session.username + ` join room，roomId：${room}`);
  let onlineUsers = await ctx.helper.onlineUsers(room);
  ctx.socket.in(room).emit('onlineCount', onlineUsers.length);
  ctx.socket.in(room).emit('online', ctx.session.username);
}

async function disconnect(ctx, app) {
  const query = ctx.socket.handshake.query;
  const room = query.room;
  setTimeout(async () => {
    let user = await app.redis.get(`${app.config._io.PREFIX_ONLINE}:${room}:${ctx.session.userId}`);
    if (!user) {
      console.log(ctx.session.username + ' disconnected');
      return ctx.socket.leave(room);
    }
    let connectTime = JSON.parse(user).connectTime;
    if (Date.now() - connectTime < app.config._io.OFFLINE_DELAY_TIME) return;
    console.log(ctx.session.username + ' disconnected');
    ctx.socket.leave(room);
    app.redis.del(`${app.config._io.PREFIX_ONLINE}:${room}:${ctx.session.userId}`);
    let onlineUsers = await ctx.helper.onlineUsers(room);
    ctx.socket.in(room).emit('onlineCount', onlineUsers.length);
    ctx.socket.in(room).emit('offline', ctx.session.username);
  }, app.config._io.OFFLINE_DELAY_TIME);
}

module.exports = app => {
  return async (ctx, next) => {
    await connect(ctx, app);
    await next();
    await disconnect(ctx, app);
  };
};