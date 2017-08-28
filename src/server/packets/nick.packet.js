function onNickCommand(conn, params, prefix) {
  if (conn.loginNick) return;
  conn.loginNick = params[0];
  conn.checkLogin();
}

module.exports = (server) => {
  server.addPacketHandler("nick", onNickCommand);
};