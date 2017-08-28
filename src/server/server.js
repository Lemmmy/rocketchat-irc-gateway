import log from "../logger";

import _ from "lodash";
import net from "net";
import tls from "tls";
import glob from "glob";
import path from "path";
import fs from "fs";
import Connection from "./connection";

class Server {
  constructor() {
    this.rocketchatHost = process.env.ROCKETCHAT_HOST;
    this.serverHost = process.env.SERVER_HOST || `irc.${this.rocketchatHost}`;
    this.serverPort = parseInt(process.env.SERVER_PORT) || 6667;
    this.serverSecurePort = parseInt(process.env.SERVER_SECURE_PORT) || 6697;
    this.serverSecure = process.env.SERVER_SECURE === "true" || false;
    this.serverKey = process.env.SERVER_KEY || "server-key.pem";
    this.serverCert = process.env.SERVER_CERT || "server-cert.pem";
    this.serverCA = process.env.SERVER_CERT || "ca-cert.pem";
    this.serverSelfSigned = process.env.SERVER_SELF_SIGNED === "true" || false;
    this.connections = [];
    this.packetHandlers = {};
    this.packetSenders = {};
  }

  start() {
    this.addPacketHandlers();

    this.tcpServer = net.createServer(this.onConnection.bind(this));
    this.tcpServer.listen(this.serverPort, () => {
      log.info(`Started insecure server on port {blue:${this.serverPort}}`);
    });

    if (this.serverSecure) {
      this.tcpSecureServer = tls.createServer({
        key: fs.readFileSync(this.serverKey),
        cert: fs.readFileSync(this.serverCert),
        ca: this.serverSelfSigned ? fs.readFileSync(this.serverCA) : ""
      }, this.onConnection.bind(this));

      this.tcpSecureServer.listen(this.serverSecurePort, () => {
        log.info(`Started secure server on port {blue:${this.serverSecurePort}}`);
      });
    }
  }

  onConnection(socket) {
    socket.setEncoding("utf8");

    let connection = new Connection(this, socket);
    this.connections.push(connection);
    connection.start();
  }

  addPacketHandler(command, handler) {
    command = command.toUpperCase();

    if (!this.packetHandlers[command]) {
      this.packetHandlers[command] = [ handler ];
    } else {
      this.packetHandlers[command].push(handler);
    }
  }

  addPacketSender(name, sender) {
    this.packetSenders[name] = sender;
  }

  addPacketHandlers() {
    glob(path.join(__dirname, "/packets/**/*.packet.js"), (err, files) => {
      files.forEach(file => {
        require(file)(this);
      });

      let handlers = _.map(_.keys(this.packetHandlers), key => `{green:${key}}`);
      let senders = _.map(_.keys(this.packetSenders), key => `{green:${key}}`);

      log.info(`Added packet handlers: ${handlers.join(", ")}`);
      log.info(`Added packet senders: ${senders.join(", ")}`);
    });
  }
}

export default new Server();