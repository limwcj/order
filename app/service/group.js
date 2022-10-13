'use strict';

const Service = require('egg').Service;

class GroupService extends Service {
  constructor(ctx) {
    super(ctx);
    this.orderDb = this.app.mysql.get('order');
  }

  async getGroup(params) {
    let values =  [];
    let sql = `select *,date_format(createDate, '%Y-%m-%d') as createDate from t_group where 1 = 1`;
    if (params.groupId) {
      sql += ` and groupId = ?`;
      values.push(params.groupId);
    } else if (params.groupName) {
      sql += ` and groupName like concat("%", ?, "%")`;
      sql += ` order by rand() limit 8`;
      values.push(params.groupName);
    }
    return await this.orderDb.query(sql, values);
  }

  async createGroup(userId, groupName, creator) {
    return await this.orderDb.beginTransactionScope(async conn => {
      let count = await conn.count('t_group_members', { userId: userId });
      if (count >= 8) return false;
      let _result = await conn.insert('t_group', { groupName: groupName, creator: creator });
      await conn.insert('t_group_members', { userId: userId, groupId: _result.insertId, position: this.config.constants.position.MANAGER });
      return _result.insertId;
    }, this.ctx);
  }

  async addGroupMember(groupId, userId, position) {
    return await this.orderDb.insert('t_group_members', { userId: userId, groupId: groupId, position: position || this.config.constants.position.MANAGER });
  }

  async deleteGroupMember(groupId, userId) {
    await this.orderDb.beginTransactionScope(async conn => {
      let count = await conn.count('t_group_members', { groupId: groupId });
      await conn.delete('t_group_members', { userId: userId, groupId: groupId });
      if (count == 1) {
        await conn.delete('t_group', { groupId: groupId });
      } else{
        let sql = 'select id from t_group_members where groupId = ? ORDER BY `position` DESC  limit 1';
        let heir = await conn.query(sql, [groupId]);
        sql = `update t_group_members set position = ${this.config.constants.position.MANAGER} where id = ?`;
        await conn.query(sql, [heir[0].id]);
      }
      return true;
    }, this.ctx);
    return await this.orderDb.delete('t_group_members', { userId: userId, groupId: groupId });
  }

  async getGroupMembers(groupId) {
    let sql = `SELECT a.*,DATE_FORMAT(a.createDate, '%Y-%m-%d') AS createDate,b.username FROM t_group_members a LEFT JOIN lm_user.t_user b ON a.userId = b.userId WHERE a.groupId = ?`;
    return await this.orderDb.query(sql, [groupId]);
  }

  async getUserGroup(userId) {
    let sql = `select a.*,date_format(a.createDate, '%Y-%m-%d') as createDate,b.groupName from t_group_members a left join t_group b on a.groupId = b.groupId where a.userId = ?`;
    return await this.orderDb.query(sql, [userId]);
  }

  async checkUserBelongsGroup(userId, groupId) {
    let sql = `select * from t_group_members where groupId = ? and userId = ?`;
    return await this.orderDb.query(sql, [groupId, userId]);
  }
}

module.exports = GroupService;
