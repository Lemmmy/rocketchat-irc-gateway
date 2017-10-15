import log from "../../logger";

function authStart(conn, params) {
  conn.sasl = {
    mechanismName: params[0].toLowerCase(),
    authBuffer: ""
  };

  log.info(`User authing via SASL with {blue:${conn.sasl.mechanismName}} mechanism`);

  conn.sendCommandServer("AUTHENTICATE", "+");
}

function authContinue(conn, params) {
  let part = params[0];

  if (part === "+") {
    authDone(conn);
  } else if (part === "*") {
    log.error(`User {blue:${conn.loginNick}} aborted SASL auth`);
    conn.sasl = null;
    conn.checkLogin();
  } else if (part.length < 400) {
    conn.sasl.authBuffer += part;
    authDone(conn);
  } else {
    conn.sasl.authBuffer += part;
  }
}

function authDone(conn, params) {
  conn.sasl.authDecoded = Buffer.from(conn.sasl.authBuffer, "base64").toString("utf-8");
  conn.sasl.authParts = conn.sasl.authDecoded.split("\0");
  conn.loginPass = conn.sasl.authParts[2];
  conn.checkLogin();
}

function onAuthenticateCommand(conn, params) {
  if (!conn.sasl) {
    authStart(conn, params);
  } else {
    authContinue(conn, params);
  }
}

module.exports = (server) => {
  server.addPacketHandler("authenticate", onAuthenticateCommand);
};