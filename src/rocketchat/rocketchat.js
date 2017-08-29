import log from "../logger";

import _ from "lodash";
import util from "util";
import DDP from "ddp";
import login from "ddp-login";
import promisify from "es6-promisify";
import mdbid from "mdbid";
import EJSON from "ejson";
import glob from "glob";
import path from "path";
require("irc-colors").global();

export const ROCKETCHAT_HOST = process.env.ROCKETCHAT_HOST;
export const ROCKETCHAT_PORT = process.env.ROCKETCHAT_PORT || 443;
export const ROCKETCHAT_SECURE = process.env.ROCKETCHAT_SECURE ? process.env.ROCKETCHAT_SECURE === true : true;

export const ROCKETCHAT_PUBLIC_URL =
  (ROCKETCHAT_SECURE ? "https://" : "http://") +
  ROCKETCHAT_HOST +
  (ROCKETCHAT_PORT !== 80 || ROCKETCHAT_PORT !== 443 ? `:${ROCKETCHAT_PORT}` : "");

const MESSAGE_CACHE_SIZE = 50;

const HIGHLIGHT_TERMS = ["@here", "@channel", "@everyone", "@all"];

const ROOM_PREFIXES = {
  d: "",
  c: "#",
  p: "##"
};

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

    this.attachmentHandlers = [];
    this.addAttachmentHandlers();
  }

  async connect() {
    if (this.client) return;

    this.client = new DDP({
      host: this.host,
      port: this.port,
      maintainCollections: true
    });

    this.client.on("message", this.onRawMessage.bind(this));

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

  async updateMe() {
    this.me = _.find(this.client.collections.users, {
      username: this.username
    });
  }

  async subscribeDefault() {
    let uid = this.userInfo.id;

    this.trySubscribe("stream-notify-user", `${uid}/message`, false);
    this.trySubscribe("stream-notify-user", `${uid}/rooms-changed`, false);
    this.trySubscribe("stream-notify-user", `${uid}/subscriptions-changed`, false);
    this.trySubscribe("stream-notify-all", `${uid}/public-settings-changed`, false);
    this.trySubscribe("activeUsers");
    this.trySubscribe("userData");
  }

  async trySubscribe(method, ...params) {
    try {
      await this.subscribe(method, ...params);
    } catch(err) {
      log.error(`Failed to subscribe to ${method}`);
      log.error(err);
    }
  }

  subscribe(method, ...params) {
    return promisify(this.client.subscribe.bind(this.client))(method, [...params]);
  }

  async observeDefault() {
    this.observe("users", (id) => { // user added (online)
      this.setUserActivity(id, true);
    }, () => {}, (id) => { // user removed (offline)
      this.setUserActivity(id, false);
    });
  }

  async logObserve(collection) {
    this.observe(collection, (id) => {
      log.debug(`{green:${collection}} added {blue:${id}}`);
    }, (id) => {
      log.debug(`{blue:${collection}} changed {blue:${id}}`);
    }, (id) => {
      log.debug(`{red:${collection}} removed {blue:${id}}`);
    });

    log.debug(`Now observing {blue:${collection}}`);
  }

  setUserActivity(id, online) {
    this.userStatuses[id] = online;
  }

  observe(collection, added, changed, removed) {
    let observer = this.client.observe(collection);

    if (this.observers[collection]) this.observers[collection].push(observer);
    else this.observers[collection] = [observer];

    observer.added = added;
    observer.changed = changed;
    observer.removed = removed;
  }

  async updateRooms() {
    (await this.callDated("rooms/get")).forEach(room => {
      if (room.t === "d") {
        this.addDM(room);
      }

      this.rooms[room._id] = room;
    });
  }

  async joinDefaultRooms() {
    _.forOwn(this.rooms, room => {
      if (room.t === "d") return;
      this.joinRoom(room);
    });
  }

  async addDM(room) {
    let otherUserID = room._id.replace(this.me._id, "");
    room.otherUserID = otherUserID;
    this.dmRooms[room.otherUserID] = room._id;

    try {
      await this.trySubscribe("stream-room-messages", room._id, false);
    } catch (ignored) {}
  }

  async addUser(user) {
    if (!this.users[user._id]) {
      this.users[user._id] = user;

      if (user._id !== this.me._id) {
        try {
          let dm = (await this.call("createDirectMessage", user.username)).rid;
          await this.addDM(this.rooms[dm]);
        } catch (ignored) {}
      }
    } else {
      _.assign(this.users[user._id], user);
    }
  }

  async joinRoom(room) {
    let ircChannel = this.getIRCChannelName(room);

    this.connection.joinRoom(ircChannel, room.topic);
    await this.getUsersInRoom(room);

    await this.trySubscribe("stream-room-messages", room._id, false);

    let nameList = _.map(room.users, "username");
    this.connection.sendPacket("namesReply", ircChannel, nameList.join(" "));
    this.connection.sendPacket("namesEnd", ircChannel);

    this.sendRoomWho(room);
  }

  async getUsersInRoom(room) {
    let users = (await this.call("getUsersOfRoom", room._id, true)).records;
    let usersObj = {};

    users.forEach(user => {
      usersObj[user._id] = user;
      this.addUser(user);
    });

    room.users = usersObj;
  }

  async getRoomFromIRCChannel(channel) {
    let t = "c";

    if (channel.startsWith("##")) t = "p";
    else if (!channel.startsWith("#")) t = "d";

    let name = channel.replace(/^##?/, "");

    if (t === "d") {
      let user = _.find(this.users, { username: name });

      if (this.dmRooms[user._id]) {
        return this.rooms[this.dmRooms[user._id]];
      }

      let dm = (await this.call("createDirectMessage", user.username)).rid;
      this.addDM(this.rooms[dm]);
      return this.rooms[dm];
    }

    return _.find(this.rooms, {name, t});
  }

  getIRCChannelName(room) {
    return `${this.getRoomPrefix(room)}${room.name}`;
  }

  getRoomPrefix(room) {
    return ROOM_PREFIXES[room.t];
  }

  call(method, ...params) {
    return promisify(this.client.call.bind(this.client))(method, [...params]);
  }

  callDated(method, ...params) {
    let date = this.callDates[method] || 0;
    this.callDates[method] = new Date().getTime();

    return this.call(method, [{ $date: date }, ...params]);
  }

  disconnect() {
    if (this.client) {
      this.client.close();
    }
  }

  onRawMessage(msg) {
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

  async addAttachmentHandlers() {
    let files = await (promisify(glob)(path.join(__dirname, "/attachments/**/*.attachment.js")));

    files.forEach(file => {
      require(file)(this);
    });

    let handlers = _.map(_.keys(this.attachmentHandlers), key => `{green:${key}}`);
    log.info(`Added attachment handlers: ${handlers.join(", ")}`);
  }

  addAttachmentHandler(type, handler) {
    if (!this.attachmentHandlers[type]) {
      this.attachmentHandlers[type] = [ handler ];
    } else {
      this.attachmentHandlers[type].push(handler);
    }
  }

  onMessage(msg) {
    let room = this.rooms[msg.rid];
    let channel = this.getIRCChannelName(room) || this.connection.loginNick;

    if (channel === "undefined") {
      channel = this.connection.loginNick;
    }

    let nick = msg.u.username;

    if (room.t === "d" && msg.u._id === this.me._id) {
      let otherUserID = room.otherUserID;
      let otherUser = this.users[otherUserID];
      msg.u = otherUser;
      msg.prefix = "[YOU] ".irc.lightgrey();
      this.onMessage(msg);

      return;
    }

    let edit = false;

    let oldMsg;
    if (oldMsg = _.find(this.messageCache, { _id: msg._id })) {
      if (oldMsg.msg === msg.msg) return;
      edit = true;
    }

    this.messageCache.push(msg);
    if (this.messageCache.length > MESSAGE_CACHE_SIZE) this.messageCache.shift();

    if (msg.attachments) {
      msg.attachments.forEach(attachment => {
        if (this.attachmentHandlers[attachment.type]) {
          this.attachmentHandlers[attachment.type].forEach(h => h(this, msg, attachment));
        }
      });
    }

    msg.msg.split("\n").forEach(line => {
      let highlight = false;

      HIGHLIGHT_TERMS.forEach(term => {
        if (line.includes(term)) highlight = true;
      });

      let prefix = (msg.prefix || "") + (edit ? "[EDIT] ".irc.lightgrey() : "");
      let suffix = highlight ? ` (cc: ${this.connection.loginNick})`.irc.red() : "";

      let fullMsg = `${prefix}${line}${suffix}`;

      if (fullMsg.trim() === "") return;

      this.connection.sendPacket("privmsg", channel, nick, fullMsg);
    });
  }

  sendMessage(room, msg) {
    let msgObj = {
      _id: mdbid(),
      rid: room._id,
      msg
    };

    this.messageCache.push(msgObj);
    if (this.messageCache.length > MESSAGE_CACHE_SIZE) this.messageCache.shift();

    this.call("sendMessage", msgObj);
    this.call("readMessages", room._id);
  }

  sendRoomWho(room) {
    let ircChannel = this.getIRCChannelName(room);

    _.forOwn(room.users, user => this.connection.sendPacket("whoReply", user.username, ircChannel, user.username, this.userStatuses[user._id]));
    this.connection.sendPacket("whoEnd", ircChannel);
  }
}