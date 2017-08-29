import log from "../logger";

import express from "express";
import glob from "glob";
import path from "path";
import promisify from "es6-promisify";

export default class Webserver {
  constructor(server) {
    this.server = server;

    this.publicURL = this.server.webserverURL;
    this.port = this.server.webserverPort;

    this.app = express();

    this.addRoutes();

    this.app.listen(this.port, () => {
      log.info(`Webserver listening on port {blue:${this.port}}`);
    });
  }

  async addRoutes() {
    let files = await (promisify(glob)(path.join(__dirname, "/routes/**/*.route.js")));

    files.forEach(file => {
      require(file)(this);
    });
  }
}