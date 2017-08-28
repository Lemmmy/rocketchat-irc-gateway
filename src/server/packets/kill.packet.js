function killPacket(conn, nick, msg) {
  conn.send({
    command: "KILL",
    parameters: [
      nick,
      msg
    ]
  });
}

module.exports = (server) => {
  server.addPacketSender("kill", killPacket);
};