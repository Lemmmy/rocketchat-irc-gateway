function welcomePacket(conn, message) {
  conn.send({
    command: "001",
    prefix: {
      server: conn.server.serverHost
    },
    parameters: [
      conn.loginNick,
      message
    ]
  });
}

module.exports = (server) => {
  server.addPacketSender("welcome", welcomePacket);
};