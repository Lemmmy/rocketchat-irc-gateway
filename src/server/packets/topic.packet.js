function topicPacket(conn, nick, channel, topic) {
  conn.send({
    command: "TOPIC",
    prefix: {
      nick,
      user: nick,
      host: conn.server.serverHost
    },
    parameters: [
      channel,
      topic
    ]
  });
}

module.exports = (server) => {
  server.addPacketSender("topic", topicPacket);
};