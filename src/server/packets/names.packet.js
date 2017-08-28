function onNameCommand(conn, params, prefix) {
  let channel = params[0];
  let users = params[1];

  conn.sendPacket("namesReply", channel, users.join(" "));
  conn.sendPacket("namesEnd", channel);
}

function namesReplyPacket(conn, channel, users) {
  conn.send({
    command: "353", // RPL_NAMREPLY
    prefix: {
      server: conn.server.serverHost
    },
    parameters: [
      conn.loginNick,
      "=", // @ secret, * private, = public
      channel,
      users
    ]
  });
}

function namesEndPacket(conn, channel) {
  conn.send({
    command: "366", // RPL_ENDOFNAMES
    prefix: {
      server: conn.server.serverHost
    },
    parameters: [
      conn.loginNick,
      channel,
      "End of /NAMES list"
    ]
  });
}

module.exports = (server) => {
  server.addPacketHandler("names", onNameCommand);
  server.addPacketSender("namesReply", namesReplyPacket);
  server.addPacketSender("namesEnd", namesEndPacket);
};