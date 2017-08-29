import _ from "lodash";

import * as RocketChat from "../../rocketchat/rocketchat";
import requestProxy from "express-request-proxy";

const proxyOptions = {
  url: RocketChat.ROCKETCHAT_PUBLIC_URL + "/file-upload/:id/:name"
};

const REDIS_ENABLED = process.env.REDIS_ENABLED === "true" || false;
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const FILE_CACHE_MAX_AGE = 60;

if (REDIS_ENABLED) {
  proxyOptions.cache = redis.createClient({
    url: REDIS_URL
  });

  proxyOptions.cacheMaxAge = FILE_CACHE_MAX_AGE;
}

function fileRoute(req, res, next) {
  if (!req.query || !req.query.t) {
    return res.status(403).send("You are not authorised to view this resource.");
  }

  let conn = _.find(this.server.connections, { webserverToken: req.query.t });

  if (!conn) {
    return res.status(403).send("You are not authorised to view this resource.");
  }

  requestProxy(_.assign(proxyOptions, {
    headers: {
      "Cookie": `rc_uid=${conn.rocketchat.me._id}; rc_token=${conn.rocketchat.token}`
    }
  }))(req, res, next);
}

module.exports = server => {
  server.app.get("/file/:id/:name", fileRoute.bind(server));
};