function topicPacket(conn, channel, topic) {
  conn.send({
    command: "TOPIC",
    prefix: {
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