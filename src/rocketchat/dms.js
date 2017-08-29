module.exports = {
  async addDM(room) {
    let otherUserID = room._id.replace(this.me._id, "");
    room.otherUserID = otherUserID;
    this.dmRooms[room.otherUserID] = room._id;

    try {
      await this.trySubscribe("stream-room-messages", room._id, false);
    } catch (ignored) {}
  }
};