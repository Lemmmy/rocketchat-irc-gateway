import promisify from "es6-promisify";

module.exports = {
  call(method, ...params) {
    return promisify(this.client.call.bind(this.client))(method, [...params]);
  },

  callDated(method, ...params) {
    let date = this.callDates[method] || 0;
    this.callDates[method] = new Date().getTime();

    return this.call(method, [{ $date: date }, ...params]);
  }
};