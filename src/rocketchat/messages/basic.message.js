import _ from "lodash";

import * as RocketChat from "../../rocketchat/rocketchat";

function basicMessage(msg) {
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
  if (this.messageCache.length > RocketChat.MESSAGE_CACHE_SIZE) this.messageCache.shift();

  if (msg.attachments) {
    msg.attachments.forEach(attachment => {
      if (this.attachmentHandlers[attachment.type]) {
        this.attachmentHandlers[attachment.type].forEach(h => h(this, msg, attachment));
      }
    });
  }

  msg.msg.split("\n").forEach(line => {
    let highlight = false;

    RocketChat.HIGHLIGHT_TERMS.forEach(term => {
      if (line.includes(term)) highlight = true;
    });

    let prefix = (msg.prefix || "") + (edit ? "[EDIT] ".irc.lightgrey() : "");
    let suffix = highlight ? ` (cc: ${this.connection.loginNick})`.irc.red() : "";

    let fullMsg = `${prefix}${line}${suffix}`;

    if (fullMsg.trim() === "") return;

    this.connection.sendPacket("privmsg", channel, nick, fullMsg);
  });
}

module.exports = (rocketchat) => {
  rocketchat.addMessageHandler("basic", basicMessage);
};