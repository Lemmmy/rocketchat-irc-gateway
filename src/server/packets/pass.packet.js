function onPassCommand(conn, params, prefix) {
  if (conn.loginPass) return;
  conn.loginPass = params[0];
  conn.checkLogin();
}

function passMismatchErrorPacket(conn, msg) {
  conn.sendCommandServer("464", msg); // ERR_PASSWDMISMATCH
}

module.exports = (server) => {
  server.addPacketHandler("pass", onPassCommand);
  server.addPacketSender("passMismatchError", passMismatchErrorPacket);
};