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
  conn.sendCommandServer("352", nick, channel, nick, conn.server.serverHost,
    conn.server.serverHost, nick, online ? "H" : "G", ":0", fullName); // RPL_WHOREPLY
}

function whoEndPacket(conn, channel) {
  conn.sendCommandServer("315", channel, "End of WHO list");
}

module.exports = (server) => {
  server.addPacketHandler("who", onWhoCommand);
  server.addPacketSender("whoReply", whoReplyPacket);
  server.addPacketSender("whoEnd", whoEndPacket);
};