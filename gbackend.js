const server = require("./lib/server");

module.exports={
  getMiddlewares     : server.getMiddlewares,
  listen             : server.listen,
  set                : server.setConfiguration,
  useMiddlewares     : server.setMiddlewares
};
