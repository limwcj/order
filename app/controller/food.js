'use strict';

const Controller = require('egg').Controller;

class FoodController extends Controller {

  async getFood() {
    if (!this.ctx.request.body.groupId) return this.ctx.body = {code: -1, message: '参数错误！'};
    let result = await this.ctx.service.food.getFood(this.ctx.request.body);
    this.ctx.body = {code: 0, message: 'success！', result: result};
  }

  async updateFood() {
    if (!this.ctx.request.body.foodId) return this.ctx.body = {code: -1, message: '参数错误！'};
    let result = await this.ctx.service.food.getFood({foodId: this.ctx.request.body.foodId});
    if (!result.length) return this.ctx.body = {code: -1, message: '店铺不存在！'};
    let checkResult = await this.ctx.service.group.checkUserBelongsGroup(this.ctx.session.userId, result[0].groupId);
    if (!checkResult.length) return this.ctx.body = {code: -1, message: '你还不是该饭团的成员哦！'};
    let _params = {};
    if (this.ctx.request.body.foodName) _params.foodName = this.ctx.request.body.foodName;
    if (this.ctx.request.body.location) _params.location = this.ctx.request.body.location;
    if (!Object.keys(_params)) return this.ctx.body = {code: -1, message: '参数错误！'};
    try {
      let result = await this.ctx.service.food.updateFood(_params, this.ctx.request.body.foodId);
      if (result.affectedRows) return this.ctx.body = {code: 0, message: 'success！'};
      return this.ctx.body = {code: -1, message: '更新失败！'};
    } catch (e) {
      this.logger.error(e);
      return this.ctx.body = {code: -1, message: '更新失败！'};
    }
  }

  async addFood() {
    if (!this.ctx.request.body.foodName || !this.ctx.request.body.location || !this.ctx.request.body.groupId) return this.ctx.body = {code: -1, message: '参数错误！'};
    if (this.config.illegalWords.indexOf(this.ctx.request.body.foodName) != -1) return this.ctx.body = {code: -1, message: '敏感词汇'};
    try {
      let _params = this.ctx.request.body;
      _params.creator = this.ctx.session.username;
      let result = await this.ctx.service.food.addFood(_params);
      this.ctx.body = {code: 0, message: 'success！', result: {foodId: result.insertId}};
    } catch (e) {
      if (e.errno == 1062) return this.ctx.body = {code: -1, message: '店铺已存在！'};
      this.logger.error(e);
      return this.ctx.body = {code: -1, message: '添加失败！'};
    }
  }
}
module.exports = FoodController;
