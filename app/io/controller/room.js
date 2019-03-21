'use strict';

module.exports = app => {
  class Controller extends app.Controller {
    async onlineCount() {
      let room = this.ctx.args[0];
      this.ctx.socket.emit('onlineCount', (await this.ctx.helper.onlineUsers(room)).length);
    }
  }
  return Controller;
};