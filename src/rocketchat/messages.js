import _ from "lodash";

import log from "../logger";

import mdbid from "mdbid";
import promisify from "es6-promisify";
import glob from "glob";
import path from "path";

module.exports = {
  async addAttachmentHandlers() {
    let files = await (promisify(glob)(path.join(__dirname, "/attachments/**/*.attachment.js")));
    files.forEach(file => require(file)(this));

    let handlers = _.map(_.keys(this.attachmentHandlers), key => `{green:${key}}`);
    log.debug(`Added attachment handlers: ${handlers.join(", ")}`);
  },

  addAttachmentHandler(type, handler) {
    if (!this.attachmentHandlers[type]) {
      this.attachmentHandlers[type] = [ handler ];
    } else {
      this.attachmentHandlers[type].push(handler);
    }
  },

  async addMessageHandlers() {
    let files = await (promisify(glob)(path.join(__dirname, "/messages/**/*.message.js")));
    files.forEach(file => require(file)(this));

    let handlers = _.map(_.keys(this.messageHandlers), key => `{green:${key}}`);
    log.debug(`Added message handlers: ${handlers.join(", ")}`);
  },

  addMessageHandler(type, handler) {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [ handler ];
    } else {
      this.messageHandlers[type].push(handler);
    }
  },

  onMessage(msg) {
    let type = msg.t || "basic";

    if (this.messageHandlers[type]) {
      this.messageHandlers[type].forEach(h => h.bind(this)(msg));
    }
  },

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
};