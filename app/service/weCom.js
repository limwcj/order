'use strict';

const axios = require('axios');

const Service = require('egg').Service;

class WeComService extends Service {
  constructor(ctx) {
    super(ctx);
    this.orderDb = this.app.mysql.get('order');
  }

  sendText(content) {
    const data = {
      msgtype: 'text',
      text: { content },
    };
    return axios.post(this.config.weCom.webhook, data);
  }
}

module.exports = WeComService;
