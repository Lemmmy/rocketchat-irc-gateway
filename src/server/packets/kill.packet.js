function killPacket(conn, nick, msg) {
  conn.sendCommand("KILL", nick, msg);
}

module.exports = (server) => {
  server.addPacketSender("kill", killPacket);
};