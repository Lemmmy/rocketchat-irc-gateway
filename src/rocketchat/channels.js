import _ from "lodash";

const ROOM_PREFIXES = {
  d: "",
  c: "#",
  p: "##"
};

module.exports = {
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
  },

  getIRCChannelName(room) {
    return `${this.getRoomPrefix(room)}${room.name}`;
  },

  getRoomPrefix(room) {
    return ROOM_PREFIXES[room.t];
  }
};