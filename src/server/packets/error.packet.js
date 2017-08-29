function errorPacket(conn, msg) {
  conn.sendCommand("ERROR", msg);
}

function noSuchChannelError(conn, channel, msg) {
  conn.sendCommand("403", msg); // ERR_NOSUCHCHANNEL
}

module.exports = (server) => {
  server.addPacketSender("error", errorPacket);
  server.addPacketSender("noSuchChannelError", noSuchChannelError);
};