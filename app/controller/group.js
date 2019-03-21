'use strict';

const Controller = require('egg').Controller;

class GroupController extends Controller {
  async createGroup() {
    if (!this.ctx.request.body.groupName) return this.ctx.body = {code: -1, message: '参数错误！'};
    if (this.config.illegalWords.indexOf(this.ctx.request.body.groupName) != -1) return this.ctx.body = {code: -1, message: '敏感词汇'};
    try {
      let result = await this.ctx.service.group.createGroup(this.ctx.session.userId, this.ctx.request.body.groupName, this.ctx.session.username);
      if (!result) return this.ctx.body = {code: -1, message: '每人限拥有8个饭团'};
      return this.ctx.body = {code: 0, message: 'success！', result: result};
    } catch (e) {
      if (e.errno == 1062) return this.ctx.body = {code: -1, message: '饭团已存在！'};
      this.logger.error(e);
      return this.ctx.body = {code: -1, message: '创建失败！'};
    }
  }

  async getGroup() {
    if (!this.ctx.request.body.groupId && !this.ctx.request.body.groupName) return this.ctx.body = {code: -1, message: '参数错误！'};
    let result = await this.ctx.service.group.getGroup(this.ctx.request.body);
    this.ctx.body = {code: 0, message: 'success！', result: result};
  }

  async getUserGroup() {
    let result = await this.ctx.service.group.getUserGroup(this.ctx.session.userId);
    this.ctx.body = {code: 0, message: 'success！', result: result};
  }

  async getGroupMembers() {
    if (!this.ctx.request.body.groupId) return this.ctx.body = {code: -1, message: '参数错误！'};
    let result = await this.ctx.service.group.getGroupMembers(this.ctx.request.body.groupId);
    this.ctx.body = {code: 0, message: 'success！', result: result};
  }

  async joinGroup() {
    if (!this.ctx.request.body.groupId) return this.ctx.body = {code: -1, message: '参数错误！'};
    try {
      await this.ctx.service.group.addGroupMember(this.ctx.request.body.groupId, this.ctx.session.userId);
      this.ctx.body = {code: 0, message: 'success！'};
    } catch (e) {
      console.error(e);
      return this.ctx.body = {code: -1, message: '加入失败！'};
    }
  }

  async exitGroup() {
    if (!this.ctx.request.body.groupId) return this.ctx.body = {code: -1, message: '参数错误！'};
    try {
      await this.ctx.service.group.deleteGroupMember(this.ctx.request.body.groupId, this.ctx.session.userId);
      this.ctx.body = {code: 0, message: 'success！'};
    } catch (e) {
      console.error(e);
      return this.ctx.body = {code: -1, message: '退出失败！'};
    }
  }
}

module.exports = GroupController;
