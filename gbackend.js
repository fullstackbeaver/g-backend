const server = require("./lib/server");

module.exports={
  getMiddlewares     : server.getMiddlewares,
  listen             : server.listen,
  // page               : require("./lib/page"),
  set                : server.setConfiguration,
  useMiddlewares     : server.setMiddlewares
};
