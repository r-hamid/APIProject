import server from "./server.js";
import worker from "./workers.js";

const app = {
  init: () => {
    // statring server
    server.init();

    // Starting worker
    worker.init();
  },
};

// Starting all servers
app.init();

export default app;
