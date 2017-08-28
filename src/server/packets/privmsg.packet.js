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
  conn.send({
    command: "PRIVMSG",
    prefix: {
      nick: nick,
      server: conn.server.host
    },
    parameters: [
      dest,
      msg
    ]
  });
}

module.exports = (server) => {
  server.addPacketHandler("privmsg", onPrivmsgCommand);
  server.addPacketSender("privmsg", privmsgPacket);
};