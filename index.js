import Server from "./server.js";
import Worker from "./workers.js";

class App extends Worker {
  constructor() {
    super();
    this.initWorker();
  }

  init() {
    // statring server
    // this.initServer();

    // Starting worker
    // worker.init();
  }
}

// Starting all servers
const app = new App();
app.init();

export default app;
