async function onPrivmsgCommand(conn, params, prefix) {
  const rc = conn.rocketchat;

  let channel = params[0];
  let room = await rc.getRoomFromIRCChannel(channel);

  if (!room) {
    return conn.sendPacket("noSuchChannelError", channel);
  }

  let msg = params[1];

  rc.sendMessage(room, msg);
}

function privmsgPacket(conn, dest, nick, msg) {
  console.log("Hi " + dest +" and " + nick);

  conn.sendCommandPrefix("PRIVMSG", {
    nick,
    user: nick,
    server: conn.server.serverHost
  }, dest, msg);
}

module.exports = (server) => {
  server.addPacketHandler("privmsg", onPrivmsgCommand);
  server.addPacketSender("privmsg", privmsgPacket);
};