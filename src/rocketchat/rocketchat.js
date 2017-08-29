import log from "../logger";

import _ from "lodash";
import DDP from "ddp";
import login from "ddp-login";
import promisify from "es6-promisify";
import EJSON from "ejson";
import util from "util";
require("irc-colors").global();

export const ROCKETCHAT_HOST = process.env.ROCKETCHAT_HOST;
export const ROCKETCHAT_PORT = process.env.ROCKETCHAT_PORT || 443;
export const ROCKETCHAT_SECURE = process.env.ROCKETCHAT_SECURE ? process.env.ROCKETCHAT_SECURE === true : true;

export const ROCKETCHAT_PUBLIC_URL =
  (ROCKETCHAT_SECURE ? "https://" : "http://") +
  ROCKETCHAT_HOST +
  (ROCKETCHAT_PORT !== 80 || ROCKETCHAT_PORT !== 443 ? `:${ROCKETCHAT_PORT}` : "");

export const MESSAGE_CACHE_SIZE = 50;

export const HIGHLIGHT_TERMS = ["@here", "@channel", "@everyone", "@all"];

const modules = ["./users", "./rooms", "./dms", "./channels", "./messages", "./subscriptions", "./observers", "./methods"];

export default class RocketChat {
  constructor(connection, username, password) {
    this.connection = connection;
    this.server = connection.server;

    this.host = ROCKETCHAT_HOST;
    this.port = ROCKETCHAT_PORT;
    this.username = username;
    this.password = password;
    this.secure = ROCKETCHAT_SECURE;

    this.rooms = {};
    this.users = {};
    this.observers = {};
    this.callDates = {};
    this.userStatuses = {};
    this.dmRooms = {};

    this.messageCache = [];

    modules.forEach(module => _.assign(this, require(module)));

    this.attachmentHandlers = [];
    this.addAttachmentHandlers();

    this.messageHandlers = [];
    this.addMessageHandlers();
  }

  async connect() {
    if (this.client) return;

    this.client = new DDP({
      host: this.host,
      port: this.port,
      maintainCollections: true,
      autoReconnect: true,
      autoReconnectTimer: 15
    });

    this.client.on("message", this.onData.bind(this));
    this.client.on("socket-close", this.onSocketClose.bind(this));
    this.client.on("socket-error", this.onSocketError.bind(this));

    await promisify(this.client.connect.bind(this.client))();

    this.userInfo = (await promisify(login)(this.client, {
      account: this.username,
      pass: this.password,
      method: "username",
      retry: 5
    }));

    this.token = this.userInfo.token;

    await this.updateMe();
    await this.subscribeDefault();
    await this.observeDefault();
    await this.updateRooms();
    await this.joinDefaultRooms();
  }

  disconnect() {
    if (this.client) {
      this.client.close();
    }
  }

  onData(msg) {
    log.trace(msg);

    try {
      msg = EJSON.parse(msg);

      if (msg.msg === "changed" && msg.collection === "stream-room-messages") {
        try {
          msg.fields.args.forEach(this.onMessage.bind(this));
        } catch (e) {
          log.error(e.stack || e);
        }
      }
    } catch (ignored) {}
  }

  onSocketClose(code, msg) {
    this.connection.sendPacket("notice", "*", "Disconnected from rocketchat".irc.red());
    this.connection.sendPacket("notice", "*", `[${code.toString().irc.red()}] ${msg}`);

    this.connection.disconnect();
  }

  onSocketError(error) {
    log.error("Socket error");
    log.error(util.inspect(error, {
      colors: true,
      depth: null
    }));

    this.connection.sendPacket("notice", "*", "Error in rocketchat socket".irc.red());
  }
}