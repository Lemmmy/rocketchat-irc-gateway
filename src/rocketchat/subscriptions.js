import log from "../logger";

import promisify from "es6-promisify";

module.exports = {
  async subscribeDefault() {
    let uid = this.userInfo.id;

    this.trySubscribe("stream-notify-user", `${uid}/message`, false);
    this.trySubscribe("stream-notify-user", `${uid}/rooms-changed`, false);
    this.trySubscribe("stream-notify-user", `${uid}/subscriptions-changed`, false);
    this.trySubscribe("stream-notify-all", `${uid}/public-settings-changed`, false);
    this.trySubscribe("activeUsers");
    this.trySubscribe("userData");
  },

  async trySubscribe(method, ...params) {
    try {
      await this.subscribe(method, ...params);
    } catch(err) {
      log.error(`Failed to subscribe to ${method}`);
      log.error(err);
    }
  },

  subscribe(method, ...params) {
    return promisify(this.client.subscribe.bind(this.client))(method, [...params]);
  }
};