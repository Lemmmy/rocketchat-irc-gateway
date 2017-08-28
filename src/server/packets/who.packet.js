async function onWhoCommand(conn, params, prefix) {
  const rc = conn.rocketchat;

  let channel = params[0];
  let room = await rc.getRoomFromIRCChannel(channel);

  if (!room) {
    return conn.sendPacket("noSuchChannelError", channel);
  }

  rc.sendRoomWho(room);
}

function whoReplyPacket(conn, nick, channel, fullName, online) {
  conn.send({
    command: "352", // RPL_WHOREPLY
    prefix: {
      server: conn.server.serverHost
    },
    parameters: [
      nick,
      channel,
      nick,
      conn.server.serverHost,
      conn.server.serverHost,
      nick,
      online ? "H": "G",
      ":0",
      fullName
    ]
  });
}

function whoEndPacket(conn, channel) {
  conn.send({
    command: "315", // RPL_ENDOFWHO
    prefix: {
      server: conn.server.serverHost
    },
    parameters: [
      channel,
      "End of WHO list"
    ]
  });
}

module.exports = (server) => {
  server.addPacketHandler("who", onWhoCommand);
  server.addPacketSender("whoReply", whoReplyPacket);
  server.addPacketSender("whoEnd", whoEndPacket);
};