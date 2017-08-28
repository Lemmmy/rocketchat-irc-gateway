function joinPacket(conn, nick, channel) {
  conn.send({
    command: "JOIN",
    prefix: {
      nick,
      user: nick,
      host: conn.server.serverHost
    },
    parameters: [
      channel
    ]
  });
}

module.exports = (server) => {
  server.addPacketSender("join", joinPacket);
};