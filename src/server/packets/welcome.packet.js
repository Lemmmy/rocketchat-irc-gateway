function welcomePacket(conn, message) {
  conn.sendCommandServer("001", conn.loginNick, message); // RPL_WELCOME
}

module.exports = (server) => {
  server.addPacketSender("welcome", welcomePacket);
};