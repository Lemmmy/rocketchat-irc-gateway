import log from "../logger";

import _ from "lodash";
import util from "util";
import {PassThrough} from "stream";
import {Composer, Parser} from "erk";
import randToken from "rand-token";

import RocketChat from "../rocketchat/rocketchat";

const PING_RATE = 20000;
const TIMEOUT_DELAY = 240000;

export default class Connection {
  constructor(server, socket) {
    this.state = "connecting";

    this.server = server;
    this.socket = socket;
    this.connectionName = `${socket.remoteAddress}:${socket.remotePort}`;
    this.parserOutput = new PassThrough({ objectMode: true });
    this.parser = new Parser();
    this.composer = new Composer();
    this.webserverToken = randToken.generate(16);

    log.info(`Incoming connection ${this.connectionName}`);

    this.socket.on("data", this.onData.bind(this));
    this.parserOutput.on("data", this.onParsedData.bind(this));

    this.socket.on("close", this.onClose.bind(this));
    this.lastPong = new Date().getTime();

    setTimeout(this.ping.bind(this), PING_RATE);
  }

  start() {
    this.parser.pipe(this.parserOutput);
    this.composer.pipe(this.socket);
  }

  onData(data) {
    this.parser.write(data.toString().replace(/\r?\n/g, "\r\n"));
  }

  onParsedData(data) {
    let command = data.command.toUpperCase();
    let handlers = this.server.packetHandlers[command];

    if (!handlers) {
      log.trace(util.inspect(data, {
        depth: null,
        colors: true,
        showHidden: true
      }));

      return;
    }

    handlers.forEach(handler => {
      handler(this, data.parameters, data.prefix);
    });
  }

  send(data) {
    this.composer.write(data);
  }

  sendPacket(name, ...args) {
    if (!this.server.packetSenders[name]) return;
    this.server.packetSenders[name](this, ...args);
  }

  checkLogin() {
    if (!this.loginNick || !this.loginPass) return;

    this.state = "registered";
    log.info(`User {green:${this.loginNick}} registered`);

    this.onRegistered();
  }

  async onRegistered() {
    this.sendPacket("welcome", `Welcome to rocket.chat IRC gateway for ${this.server.rocketchatHost}`);

    this.rocketchat = new RocketChat(this, this.loginNick, this.loginPass);

    await this.rocketchatConnect();
  }

  async rocketchatConnect() {
    this.state = "rc-connecting";
    this.sendPacket("notice", "*", "Connecting to rocket.chat...");

    try {
      await this.rocketchat.connect();
    } catch (err) {
      if (err.error && err.error === 403) {
        this.sendPacket("error", "Error: incorrect login");
        return this.disconnect();
      }

      log.error("Connection error");
      log.error(err.stack || util.inspect(err));

      this.sendPacket("error", "Error: Could not connect to rocket.chat");
      this.sendPacket("kill", this.loginNick, "Error: Could not connect to rocket.chat");
      return this.disconnect();
    }

    this.sendPacket("notice", "*", `Successfully connected`);
  }

  joinRoom(room, topic) {
    this.sendPacket("join", this.loginNick, room);

    if (topic) {
      this.sendPacket("topic", "", room, topic);
    }
  }

  ping() {
    let now = new Date().getTime();

    if (this.lastPong + TIMEOUT_DELAY < now) {
      log.info(`User {green:${this.loginNick}} timed out`);
      return this.disconnect();
    }

    this.sendPacket("ping", now);

    setTimeout(this.ping.bind(this), PING_RATE);
  }

  onClose() {
    this.disconnect();
  }

  disconnect() {
    log.info(`User {green:${this.loginNick}} disconnecting {grey:(socket state: {red:${this.socket.readyState}})}`);

    if (this.socket.readyState === "open") {
      this.socket.end();
    }

    if (this.rocketchat) {
      this.rocketchat.disconnect();
    }

    _.pull(this.server.connections, this);
  }
}