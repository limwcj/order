'use strict';

const Service = require('egg').Service;

class FoodService extends Service {
  constructor(ctx) {
    super(ctx);
    this.orderDb = this.app.mysql.get('order');
  }

  async getFood(params) {
    return await this.orderDb.select('t_food', { where: params, orders: [['createDate', 'desc']] });
  }

  async updateFood(params, foodId) {
    params.updateDate = this.orderDb.literals.now;
    return await this.orderDb.update('t_food', params, { where: { foodId: foodId } });
  }

  async addFood(params) {
    return await this.orderDb.insert('t_food', params);
  }

  async getRandomFood(groupId) {
    const foods = await this.orderDb.select('t_food', { where: { groupId } });
    return foods[Math.floor(Math.random() * foods.length)];
  }
}

module.exports = FoodService;
