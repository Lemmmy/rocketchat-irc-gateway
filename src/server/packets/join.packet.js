import log from "../../logger";

import util from "util";

function joinPacket(conn, nick, channel) {
  conn.sendCommandPrefix("JOIN", {
    nick,
    user: nick,
    host: conn.server.serverHost
  }, channel);
}

async function onJoinCommand(conn, params, prefix) {
  let channel = params[0];

  try {
    await conn.rocketchat.joinRoom(channel);
  } catch (e) {
    if (e.error) {
      switch (e.error) {
        case 500:
          return conn.sendPacket("noSuchChannelError");
      }
    }

    log.error(e.stack || util.inspect(e, {
      colors: true,
      depth: null
    }));
  }
}

module.exports = (server) => {
  server.addPacketSender("join", joinPacket);
  server.addPacketHandler("join", onJoinCommand);
};