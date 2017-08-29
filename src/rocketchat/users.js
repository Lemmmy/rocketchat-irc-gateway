import _ from "lodash";

module.exports = {
  async updateMe() {
    this.me = _.find(this.client.collections.users, {
      username: this.username
    });
  },

  setUserActivity(id, online) {
    this.userStatuses[id] = online;
  },

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
  },

  async getUsersInRoom(room) {
    let users = (await this.call("getUsersOfRoom", room._id, true)).records;
    let usersObj = {};

    users.forEach(user => {
      usersObj[user._id] = user;
      this.addUser(user);
    });

    room.users = usersObj;
  }
};