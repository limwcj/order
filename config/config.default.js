"use strict";
const path = require("path");

module.exports = appInfo => {
  return {
    cluster: {
      listen: {
        port: 9999,
        workers: 1
      }
    },
    keys: appInfo.name + "_test",
    logger: {
      consoleLevel: "INFO",
      level: "INFO",
      dir: path.join(appInfo.baseDir, "logs")
    },
    logrotator: {
      maxDays: 3
    },
    mysql: {
      clients: {
        order: {
          database: "lm_order"
        },
        user: {
          database: "lm_user"
        }
      },
      default: {
        host: "localhost",
        port: "3306",
        user: "root",
        password: "password",
        supportBigNumbers: true
      }
    },
    session: {
      key: "lm",
      maxAge: 7 * 24 * 3600 * 1000
    },
    middleware: ["checkLogin"],
    constants: {
      position: {
        MANAGER: 1,
        MEMBER: 0
      }
    },
    io: {
      init: {},
      namespace: {
        "/": {
          connectionMiddleware: ["auth"],
          packetMiddleware: ["packet"]
        }
      }
    },
    redis: {
      client: {
        host: "localhost",
        port: 6379,
        password: "password",
        db: 0
      }
    },
    _io: {
      PREFIX_ONLINE: `order:online`,
      PREFIX_VOTE: `order:vote`,
      OFFLINE_DELAY_TIME: 3000 //下线延时 毫秒s
    },
    illegalWords: ["饭团", "匿名用户", "投票", "随机"]
  };
};
