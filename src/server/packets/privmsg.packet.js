import log from "../../logger";

function onPrivmsgCommand(conn, params, prefix) {
  const rc = conn.rocketchat;

  let channel = params[0];
  let room = rc.getRoomFromIRCChannel(channel);

  if (!room) {
    return conn.sendPacket("noSuchChannelError", channel);
  }

  let msg = params[1];

  log.debug(`{blue:${channel}} ${msg}`);
  rc.sendMessage(room, msg);
}

module.exports = (server) => {
  server.addPacketHandler("privmsg", onPrivmsgCommand);
};