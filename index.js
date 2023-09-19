import Server from "./server.js";
import Worker from "./workers.js";

class App {
  server;

  worker;

  constructor() {
    this.server = new Server();
    this.worker = new Worker();
  }

  init() {
    // statring server
    this.server.createServer();
    this.server.initServer();

    // Starting worker
    this.worker.initWorker();
  }
}

// Starting all servers
const app = new App();
app.init();

export default app;
