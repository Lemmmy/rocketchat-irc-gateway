function pingPacket(conn, msg) {
  conn.sendCommand("PING", `:${msg}`);
}

function pongPacket(conn, msg) {
  conn.sendCommandServer("PONG", `:${msg}`);
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