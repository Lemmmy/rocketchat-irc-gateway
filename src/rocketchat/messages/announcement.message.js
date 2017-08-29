function announcementMessage(msg) {
  let room = this.rooms[msg.rid];
  let channel = this.getIRCChannelName(room);
  let user = msg.u.username;
  let announcement = msg.msg;

  this.connection.sendPacket("notice", channel, `${user.irc.bold()} changed channel announcement: ${announcement.irc.red()}`);
}

module.exports = (rocketchat) => {
  rocketchat.addMessageHandler("room_changed_announcement", announcementMessage);
};