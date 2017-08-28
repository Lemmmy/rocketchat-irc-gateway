function noticePacket(conn, channel, msg) {
  conn.send({
    command: "NOTICE",
    prefix: {
      host: conn.server.serverHost
    },
    parameters: [
      channel,
      msg
    ]
  });
}

module.exports = (server) => {
  server.addPacketSender("notice", noticePacket);
};