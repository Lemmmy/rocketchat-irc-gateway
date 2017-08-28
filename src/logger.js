const tfunk = require("tfunk");
const moment = require("moment");

module.exports = require("eazy-logger").Logger({
  prefix: () => tfunk(`[${moment().format("[{gray:]YYYY-MM-DD[}] [{white.dim.bold:]HH:mm:ss[}]")} `),
  useLevelPrefixes: true,
  level: process.env.LOG_LEVEL || "warn",
  prefixes: {
    "trace": "{grey:trace}] ",
    "debug": "{yellow:debug}] ",
    "info":  "{cyan:info}] ",
    "warn":  "{magenta:warn}] ",
    "error": "{red:error}  "
  },
});