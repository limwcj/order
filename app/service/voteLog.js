'use strict';

const Service = require('egg').Service;

class VoteLogService extends Service {
  constructor(ctx) {
    super(ctx);
    this.orderDb = this.app.mysql.get('order');
  }

  async addVoteLog(params) {
    return await this.orderDb.insert('t_vote_log', params);
  }
}

module.exports = VoteLogService;