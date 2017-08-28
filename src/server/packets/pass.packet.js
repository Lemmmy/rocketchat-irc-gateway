function onPassCommand(conn, params, prefix) {
  if (conn.loginPass) return;
  conn.loginPass = params[0];
  conn.checkLogin();
}

function passMismatchErrorPacket(conn, msg) {
  conn.send({
    command: "464", // ERR_PASSWDMISMATCH
    prefix: {
      server: conn.server.serverHost
    },
    parameters: [
      msg
    ]
  });
}

module.exports = (server) => {
  server.addPacketHandler("pass", onPassCommand);
  server.addPacketSender("passMismatchError", passMismatchErrorPacket);
};