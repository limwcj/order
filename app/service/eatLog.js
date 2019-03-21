'use strict';

const Service = require('egg').Service;

class EatLogService extends Service {
  constructor(ctx) {
    super(ctx);
    this.orderDb = this.app.mysql.get('order');
  }

  async checkVoteEndLog(voteId) {
    return await this.orderDb.get('t_eat_log', {voteId: voteId});
  }

  async addEatLog(params) {
    return await this.orderDb.insert('t_eat_log', params);
  }
}

module.exports = EatLogService;