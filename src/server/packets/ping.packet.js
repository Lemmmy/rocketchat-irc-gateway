function pingPacket(conn, msg) {
  conn.send({
    command: "PING",
    parameters: [
      `:${msg}`
    ]
  })
}

function pongPacket(conn, msg) {
  conn.send({
    command: "PONG",
    prefix: {
      server: conn.server.serverHost
    },
    parameters: [
      `:${msg}`
    ]
  })
}

function onPingCommand(conn, params, prefix) {
  let msg = params[0];
  conn.sendPacket("pong", msg);
}

function onPongCommand(conn, params, prefix) {
  conn.lastPong = new Date().getTime();
}

module.exports = (server) => {
  server.addPacketSender("ping", pingPacket);
  server.addPacketSender("pong", pongPacket);
  server.addPacketHandler("ping", onPingCommand);
  server.addPacketHandler("pong", onPongCommand);
};