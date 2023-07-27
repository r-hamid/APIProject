import { createServer } from "http";
import { createServer as createHttpsServer } from "https";
import { readFileSync } from "fs";

import serverConfig from "./config.js";
import { __dirname, CONSOLE_COLORS, CONSOLE_CONSTANTS } from "./constants.js";
import unifiedServer from "./helpers/server.js";

class Server {
  sslConfig;

  httpServer;

  httpsServer;

  constructor() {
    this.sslConfig = {
      key: readFileSync(`${__dirname}/https/key.pem`),
      cert: readFileSync(`${__dirname}/https/cert.pem`),
    };
  }

  createServer() {
    this.httpServer = createServer((req, res) => unifiedServer(req, res))
    this.httpsServer = createHttpsServer(this.sslConfig, (req, res) => unifiedServer(req, res))
  }

  initServer() {
    this.httpServer.listen(serverConfig.httpPort, () => {
      console.log(CONSOLE_COLORS.GREEN, `${CONSOLE_CONSTANTS.SERVER} HTTP Server listening at port: ${serverConfig.httpPort} in ${serverConfig.envName}`);
    });

    this.httpsServer.listen(serverConfig.httpsPort, () => {
      console.log(CONSOLE_COLORS.GREEN, `${CONSOLE_CONSTANTS.SERVER} HTTPS Server Listening at port: ${serverConfig.httpsPort} in ${serverConfig.envName}`);
    });
  };
}

export default Server;
