import _ from "lodash";

import mdbid from "mdbid";

module.exports = {
  async updateRooms() {
    (await this.callDated("rooms/get")).forEach(room => {
      if (room.t === "d") {
        this.addDM(room);
      }

      this.rooms[room._id] = room;
    });
  },

  async joinDefaultRooms() {
    _.forOwn(this.rooms, room => {
      if (room.t === "d") return;
      this.clientJoinRoom(room);
    });
  },

  async clientJoinRoom(room) {
    let channel = this.getIRCChannelName(room);

    this.connection.joinRoom(channel, room.topic);

    if (room.announcement) {
      this.connection.sendPacket("notice", channel, `${"Channel announcement".irc.bold()}: ${room.announcement.irc.red()}`);
    }

    await this.getUsersInRoom(room);

    await this.trySubscribe("stream-room-messages", room._id, false);

    let nameList = _.map(room.users, "username");
    this.connection.sendPacket("namesReply", channel, nameList.join(" "));
    this.connection.sendPacket("namesEnd", channel);

    this.sendRoomWho(room);
  },

  async joinRoom(name) {
    await this.call("slashCommand", {
      cmd: "join",
      params: name
    });

    await this.updateRooms();

    let room = await this.getRoomFromIRCChannel(name);
    if (!room) {
      throw Error("no room");
    }

    await this.clientJoinRoom(room);
  },

  async leaveRoom(name) {
    let room = await this.getRoomFromIRCChannel(name);

    await this.call("slashCommand", {
      cmd: "leave",
      params: "",
      msg: {
        _id: mdbid(),
        rid: room._id,
        msg: "/leave "
      }
    });

    this.connection.sendPacket("part", this.connection.loginNick, name);
  },

  sendRoomWho(room) {
    let ircChannel = this.getIRCChannelName(room);

    _.forOwn(room.users, user => this.connection.sendPacket("whoReply", user.username, ircChannel, user.username, this.userStatuses[user._id]));
    this.connection.sendPacket("whoEnd", ircChannel);
  }
};