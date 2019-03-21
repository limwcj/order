'use strict';

module.exports = app => {
  class Controller extends app.Controller {
    async vote() {
      let params = this.ctx.args[0];
      if (!params.foodId || !params.groupId || !params.number) return this.ctx.socket.emit('err', '参数错误');
      let checkResult = await this.ctx.service.group.checkUserBelongsGroup(this.ctx.session.userId, params.groupId);
      if (!checkResult.length) return this.ctx.socket.emit('err', '你还不是该饭团的成员哦');
      let _food = await this.ctx.service.food.getFood({foodId: params.foodId});
      if (!_food.length) return this.ctx.socket.emit('err', '店铺不存在');
      let foodName = _food && _food.length ? _food[0].foodName : '';
      let voteList = await app.redis.get(`${this.config._io.PREFIX_VOTE}:${params.groupId}`);
      let voteInfo = {
        userId: this.ctx.session.userId,
        groupId: params.groupId,
        foodId: null,
        newFoodId: null,
        order: 1,
        number: params.number,
        anonymity: params.anonymity
      };
      if (!voteList) {
        voteInfo.foodId = params.foodId;
        let result = await this.ctx.service.voteLog.addVoteLog(voteInfo);
        voteInfo.voteId = result.insertId;
        voteInfo.foodName = foodName;
        voteInfo.username = this.ctx.session.username;
        voteInfo.createDate = Date.now();
        voteList = [voteInfo];
        await app.redis.set(`${this.config._io.PREFIX_VOTE}:${params.groupId}`, JSON.stringify(voteList), 'EX', 4 * 3600);
        if (params.number == 1) {
          let eatLog = {
            type: 'vote',
            groupId: params.groupId,
            foodId: params.foodId,
            voteId: voteInfo.voteId,
            number: params.number
          };
          await this.ctx.service.eatLog.addEatLog(eatLog);
          this.ctx.socket.emit('voteStatus', voteList);
          return this.ctx.socket.emit('tip', '一个人的寂寞，只有我懂你');
        }
        this.ctx.socket.in(params.groupId).emit('tip', `${params.anonymity ? '匿名用户' : this.ctx.session.username} 发起了投票`);
        this.ctx.socket.emit('vote', '投票成功，请于四小时内结束投票');
      } else {
        voteList = JSON.parse(voteList);
        let lastFood = voteList[voteList.length - 1];
        let isVoteEnd = await this.ctx.service.eatLog.checkVoteEndLog(lastFood.voteId);
        if (isVoteEnd) return this.ctx.socket.emit('err', '投票已结束');
        if (_hasVote(voteList, this.ctx.session.userId)) return this.ctx.socket.emit('err', '不能重复投票');
        if (lastFood.foodId == params.foodId || lastFood.newFoodId == params.foodId) {  //赞成
          voteInfo.foodId = params.foodId;
          voteInfo.voteId = lastFood.voteId;
          voteInfo.order = voteList.length + 1;
          await this.ctx.service.voteLog.addVoteLog(voteInfo);
          voteInfo.foodName = foodName;
          voteInfo.number = lastFood.number;
          voteInfo.username = this.ctx.session.username;
          voteInfo.createDate = Date.now();
          voteList.push(voteInfo);
          this.ctx.socket.in(params.groupId).emit('tip', `${params.anonymity ? '匿名用户' : this.ctx.session.username} 赞同了 ${foodName}`);
          this.ctx.socket.emit('tip', '投票成功');
          if (voteList.slice(_findAgainstIndex(voteList)).length == lastFood.number) {
            let eatLog = {
              type: 'vote',
              groupId: voteInfo.groupId,
              foodId: voteInfo.foodId,
              voteId: voteInfo.voteId,
              number: voteInfo.number
            };
            await this.ctx.service.eatLog.addEatLog(eatLog);
          }
        } else {  //反对，并重新提议
          for (let i = 0; i < voteList.length; i++) {
            if (voteList[i].foodId == params.foodId || voteList[i].newFoodId == params.foodId) {
              return this.ctx.socket.emit('err', '投票失败，不能选择已选过的结果');
            }
          }
          voteInfo.newFoodId = params.foodId;
          voteInfo.voteId = lastFood.voteId;
          voteInfo.order = voteList.length + 1;
          await this.ctx.service.voteLog.addVoteLog(voteInfo);
          voteInfo.foodName = foodName;
          voteInfo.number = lastFood.number;
          voteInfo.username = this.ctx.session.username;
          voteInfo.createDate = Date.now();
          voteList.push(voteInfo);
          this.ctx.socket.in(params.groupId).emit('tip', `${params.anonymity ? '匿名用户' : this.ctx.session.username} 重新提议了 ${foodName}`);
          this.ctx.socket.emit('tip', '重新投票成功');
        }
      }
      await app.redis.set(`${this.config._io.PREFIX_VOTE}:${params.groupId}`, JSON.stringify(voteList), 'EX', 4 * 3600);
      app.io.in(params.groupId).emit('voteStatus', voteList);
    }

    async voteStatus() {
      let params = this.ctx.args[0];
      if (!params.groupId) return this.ctx.socket.emit('err', '参数错误');
      let checkResult = await this.ctx.service.group.checkUserBelongsGroup(this.ctx.session.userId, params.groupId);
      if (!checkResult.length) return this.ctx.socket.emit('err', '你还不是该饭团的成员哦');
      let voteInfo = await app.redis.get(`${this.config._io.PREFIX_VOTE}:${params.groupId}`);
      return this.ctx.socket.emit('voteStatus', voteInfo ? JSON.parse(voteInfo) : []);
    }

    async voteEnd() {
      let params = this.ctx.args[0];
      if (!params.groupId) return this.ctx.socket.emit('err', '参数错误');
      let checkResult = await this.ctx.service.group.checkUserBelongsGroup(this.ctx.session.userId, params.groupId);
      if (!checkResult.length) return this.ctx.socket.emit('err', '你还不是该饭团的成员哦');
      if (params.force && checkResult[0].position != this.config.constants.position.MANAGER) return this.ctx.socket.emit('err', '暂无权限，请联系团长操作取消');
      let voteList = await app.redis.get(`${this.config._io.PREFIX_VOTE}:${params.groupId}`);
      if (voteList) {
        voteList = JSON.parse(voteList);
        let voteNumber = voteList.slice(_findAgainstIndex(voteList, this.ctx.session.userId)).length;
        if ((voteNumber == voteList[voteList.length - 1].number) || params.force) { //投票已结束或团长取消
          await app.redis.del(`${this.config._io.PREFIX_VOTE}:${params.groupId}`);
          return app.io.in(params.groupId).emit('voteEnd', '投票已结束,可以发起新投票了');
        } else {
          return this.ctx.socket.emit('err', '正在投票中，无法发起新投票');
        }
      }
      return this.ctx.socket.emit('err', '点击下方任意店铺发起投票');
    }
  }
  return Controller;
};

function _findAgainstIndex(voteList) {
  for (let i = voteList.length - 1; i >= 0; i--) {
    if (voteList[i].newFoodId) return i;
  }
  return 0;
}

function _hasVote(voteList, userId) {
  let againstIndex = _findAgainstIndex(voteList);
  for (let i = againstIndex; i < voteList.length; i++) {
    if (voteList[i].userId == userId) return true;
  }
  return false;
}