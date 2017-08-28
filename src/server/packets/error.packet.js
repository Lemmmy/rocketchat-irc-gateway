function errorPacket(conn, msg) {
  conn.send({
    command: "ERROR",
    parameters: [
      msg
    ]
  });
}

function noSuchChannelError(conn, channel, msg) {
  conn.send({
    command: "403", // ERR_NOSUCHCHANNEL
    parameters: [
      channel,
      msg
    ]
  });
}

module.exports = (server) => {
  server.addPacketSender("error", errorPacket);
  server.addPacketSender("noSuchChannelError", noSuchChannelError);
};