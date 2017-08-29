function onNameCommand(conn, params, prefix) {
  let channel = params[0];
  let users = params[1];

  conn.sendPacket("namesReply", channel, users.join(" "));
  conn.sendPacket("namesEnd", channel);
}

function namesReplyPacket(conn, channel, users) {
  conn.sendCommandServer("353", conn.loginNick, "=", channel, users); // RPL_NAMREPLY
}

function namesEndPacket(conn, channel) {
  conn.sendCommandServer("366", conn.loginNick, channel, "End of /NAMES list"); // RPL_ENDOFNAMES
}

module.exports = (server) => {
  server.addPacketHandler("names", onNameCommand);
  server.addPacketSender("namesReply", namesReplyPacket);
  server.addPacketSender("namesEnd", namesEndPacket);
};