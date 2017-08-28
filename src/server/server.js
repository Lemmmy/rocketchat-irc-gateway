import log from "../logger";

import net from "net";
import glob from "glob";
import path from "path";
import Connection from "./connection";

class Server {
  constructor() {
    this.rocketchatHost = process.env.ROCKETCHAT_HOST;
    this.serverHost = process.env.SERVER_HOST || `irc.${this.rocketchatHost}`;
    this.serverPort = process.env.SERVER_PORT || 6667;
    this.connections = [];
    this.packetHandlers = {};
    this.packetSenders = {};
  }

  start() {
    this.addPacketHandlers();

    this.tcpServer = net.createServer(this.onConnection.bind(this));
    this.tcpServer.listen(this.serverPort);
  }

  onConnection(socket) {
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

    log.info(`Added packet handler for {green:${command}}`);
  }

  addPacketHandlers() {
    glob(path.join(__dirname, "/packets/**/*.packet.js"), (err, files) => {
      files.forEach(file => {
        require(file)(this);
      });
    });
  }

  addPacketSender(name, sender) {
    this.packetSenders[name] = sender;
    log.info(`Added packet sender {green:${name}}`);
  }
}

export default new Server();