import log from "../../logger";

import util from "util";

function joinPacket(conn, nick, channel) {
  conn.send({
    command: "JOIN",
    prefix: {
      nick,
      user: nick,
      host: conn.server.serverHost
    },
    parameters: [
      channel
    ]
  });
}

async function onJoinCommand(conn, params, prefix) {
  let channel = params[0];

  try {
    await conn.rocketchat.joinRoom(channel);
  } catch (e) {
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