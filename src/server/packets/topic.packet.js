function topicPacket(conn, nick, channel, topic) {
  conn.sendCommandPrefix("TOPIC", {
    nick,
    user: nick,
    host: conn.server.serverHost
  }, channel, topic);
}

module.exports = (server) => {
  server.addPacketSender("topic", topicPacket);
};