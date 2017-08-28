import _ from "lodash";

function onWhoCommand(conn, params, prefix) {
  const rc = conn.rocketchat;

  let channel = params[0];
  let room = rc.getRoomFromIRCChannel(channel);

  if (!room) {
    return conn.sendPacket("noSuchChannelError", channel);
  }

  _.forOwn(room.users, user => conn.sendPacket("whoReply", user.name, channel, user.name, rc.userStatuses[user._id]));
  conn.sendPacket("whoEnd", channel);
}

function whoReplyPacket(conn, nick, channel, fullName, online) {
  conn.send({
    command: "352", // RPL_WHOREPLY
    prefix: {
      server: conn.server.serverHost
    },
    parameters: [
      nick,
      channel,
      nick,
      conn.server.serverHost,
      conn.server.serverHost,
      nick,
      online ? "H": "G",
      ":0",
      fullName
    ]
  });
}

function whoEndPacket(conn, channel) {
  conn.send({
    command: "315", // RPL_ENDOFWHO
    prefix: {
      server: conn.server.serverHost
    },
    parameters: [
      channel,
      "End of WHO list"
    ]
  });
}

module.exports = (server) => {
  server.addPacketHandler("who", onWhoCommand);
  server.addPacketSender("whoReply", whoReplyPacket);
  server.addPacketSender("whoEnd", whoEndPacket);
};