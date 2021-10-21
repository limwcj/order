'use strict';

module.exports = (app) => {
  app.router.redirect('/', '/public/index.html', 302);
  app.router.redirect('/vote.html', '/public/vote.html', 302);

  app.router.post('/api/user/checkUsername', app.controller.user.checkUsername);
  app.router.post('/api/user/register', app.controller.user.register);
  app.router.post('/api/user/login', app.controller.user.login);
  app.router.post('/api/user/logout', app.controller.user.logout);
  app.router.post('/api/user/getUser', app.controller.user.getUser);

  app.router.post('/api/group/createGroup', app.controller.group.createGroup);
  app.router.post('/api/group/getGroup', app.controller.group.getGroup);
  app.router.post('/api/group/getUserGroup', app.controller.group.getUserGroup);
  app.router.post('/api/group/getGroupMembers', app.controller.group.getGroupMembers);
  app.router.post('/api/group/joinGroup', app.controller.group.joinGroup);
  app.router.post('/api/group/exitGroup', app.controller.group.exitGroup);

  app.router.post('/api/food/getFood', app.middleware.checkGroup(), app.controller.food.getFood);
  app.router.post('/api/food/updateFood', app.controller.food.updateFood);
  app.router.post('/api/food/addFood', app.middleware.checkGroup(), app.controller.food.addFood);

  app.io.route('onlineCount', app.io.controller.room.onlineCount);
  app.io.route('vote', app.io.controller.vote.vote);
  app.io.route('voteStatus', app.io.controller.vote.voteStatus);
  app.io.route('voteEnd', app.io.controller.vote.voteEnd);
  app.io.route('forceVoteEnd', app.io.controller.vote.forceVoteEnd);
};
