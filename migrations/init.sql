CREATE DATABASE `lm_user`;

CREATE DATABASE `lm_order`;

CREATE TABLE `t_user` (
  `userId` tinyint(4) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `t_user_username_IDX` (`username`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `t_eat_log` (
  `id` tinyint(4) NOT NULL AUTO_INCREMENT,
  `type` varchar(100) DEFAULT NULL,
  `groupId` tinyint(4) NOT NULL,
  `foodId` tinyint(4) NOT NULL,
  `voteId` tinyint(4) NOT NULL,
  `number` tinyint(4) NOT NULL DEFAULT '0',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `t_eat_log_voteId_IDX` (`voteId`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


CREATE TABLE `t_food` (
  `foodId` tinyint(4) NOT NULL AUTO_INCREMENT,
  `createDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `foodName` varchar(100) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `groupId` varchar(100) DEFAULT NULL,
  `creator` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`foodId`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;

CREATE TABLE `t_group` (
  `groupId` tinyint(4) NOT NULL AUTO_INCREMENT,
  `groupName` varchar(100) NOT NULL,
  `creator` varchar(100) DEFAULT NULL,
  `createDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`groupId`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `t_group_members` (
  `id` tinyint(4) NOT NULL AUTO_INCREMENT,
  `userId` varchar(100) NOT NULL,
  `groupId` varchar(100) NOT NULL,
  `position` tinyint(4) DEFAULT '0',
  `createDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `t_group_members_userId_IDX` (`userId`) USING BTREE,
  KEY `t_group_members_groupId_IDX` (`groupId`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `t_vote_log` (
  `type` varchar(100) DEFAULT NULL,
  `groupId` tinyint(4) NOT NULL,
  `foodId` tinyint(4) DEFAULT NULL,
  `number` tinyint(4) NOT NULL DEFAULT '0',
  `createDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `userId` tinyint(4) NOT NULL,
  `newFoodId` tinyint(4) DEFAULT NULL,
  `order` tinyint(4) DEFAULT NULL,
  `anonymity` tinyint(1) DEFAULT '0',
  `voteId` tinyint(4) NOT NULL AUTO_INCREMENT,
  KEY `t_vote_log_voteId_IDX` (`voteId`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8
