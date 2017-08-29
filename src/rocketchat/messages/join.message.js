function userJoinedMessage(msg) {
  let room = this.rooms[msg.rid];
  let channel = this.getIRCChannelName(room);
  let user = msg.u.username;

  this.connection.sendPacket("join", user, channel);
}

module.exports = (rocketchat) => {
  rocketchat.addMessageHandler("uj", userJoinedMessage);
};