function noticePacket(conn, channel, msg) {
  conn.sendCommandServer("NOTICE", channel, msg);
}

module.exports = (server) => {
  server.addPacketSender("notice", noticePacket);
};