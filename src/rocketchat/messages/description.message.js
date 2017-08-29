function descriptionMessage(msg) {
  let room = this.rooms[msg.rid];
  let channel = this.getIRCChannelName(room);
  let user = msg.u.username;
  let description = msg.msg;

  this.connection.sendPacket("notice", channel, `${user.irc.bold()} changed channel description: ${description}`);
}

module.exports = (rocketchat) => {
  rocketchat.addMessageHandler("room_changed_description", descriptionMessage);
};