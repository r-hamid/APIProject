import { createServer } from "http";
import { createServer as createHttpsServer } from "https";
import { readFileSync } from "fs";

import serverConfig from "./config.js";
import { __dirname } from "./constants.js";
import unifiedServer from "./helpers/server.js";

const server = {
  sslConfig: {
    key: readFileSync(`${__dirname}/https/key.pem`),
    cert: readFileSync(`${__dirname}/https/cert.pem`),
  },  
};

server.httpServer = createServer((req, res) => unifiedServer(req, res)),
server.httpsServer = createHttpsServer(server.sslConfig, (req, res) => unifiedServer(req, res)),

server.init = () => {
  server.httpServer.listen(serverConfig.httpPort, () => {
    console.log(`Server started. Listening at port: ${serverConfig.httpPort} in ${serverConfig.envName}`);
  });
  
  server.httpsServer.listen(serverConfig.httpsPort, () => {
    console.log(`HTTPS Server started. Listening at port: ${serverConfig.httpsPort} in ${serverConfig.envName}`);
  });
};

export default server;
