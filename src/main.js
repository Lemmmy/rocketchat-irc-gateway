import log from "./logger";
import Server from "./server/server";

log.info("Starting rocketchat-irc-gateway");

Server.start();