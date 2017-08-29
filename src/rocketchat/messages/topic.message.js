function topicMessage(msg) {
  let room = this.rooms[msg.rid];
  let channel = this.getIRCChannelName(room);
  let user = msg.u.username;
  let topic = msg.msg;

  this.connection.sendPacket("topic", user, channel, topic);
}

module.exports = (rocketchat) => {
  rocketchat.addMessageHandler("room_changed_topic", topicMessage);
};