import _ from "lodash";
import * as Connection from "../connection";

function getIdentifier(conn) {
  return conn.loginNick || "*";
}

const subcommands = {
  ls(conn) {
    conn.sendCommandServer("CAP", getIdentifier(conn), "LS", Connection.CAPABILITIES.join(" "));
  },

  list(conn) {
    conn.sendCommandServer("CAP", getIdentifier(conn), "LIST", conn.activeCapabilities.join(" "));
  },

  req(conn, params) {
    let capabilities = params[1].split(" ").map(c => c.toLowerCase());
    let ack = true;

    capabilities.forEach(capability => {
      if (!Connection.CAPABILITIES.includes(capability)) ack = false;
    });

    if (ack) {
      conn.activeCapabilities = _.concat(conn.activeCapabilities, capabilities);
      conn.sendCommandServer("CAP", getIdentifier(conn), "ACK", params[1]);
    } else {
      conn.sendCommandServer("CAP", getIdentifier(conn), "NAK", params[1]);
    }
  },

  end(conn) {}
};

function onCapCommand(conn, params) {
  let subcommand = params[0].toLowerCase();

  conn.capVersion = params[1] || 301;

  if (subcommands[subcommand]) {
    subcommands[subcommand](conn, params);
  } else {
    conn.sendCommandServer("410", getIdentifier(conn), subcommand, "Invalid CAP command"); // ERR_INVALIDCAPCMD
  }
}

module.exports = (server) => {
  server.addPacketHandler("cap", onCapCommand);
};