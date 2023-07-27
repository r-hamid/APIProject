import Server from "./server.js";
import worker from "./workers.js";

class App extends Server {
  constructor() {
    super();
    this.createServer();
  }

  init() {
    // statring server
    this.initServer();

    // Starting worker
    worker.init();
  }
}

// Starting all servers
const app = new App();
app.init();

export default app;
