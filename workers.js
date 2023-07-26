import { ListDownAllFilesAndFetchData, GetEachContentFromFile } from "./helpers/workers.js";
import Logs from "./lib/logs.js";

const worker = {
  checkOutcome: {
    error: null,
    responseCode: 0,
  },
  isOutComeSent: false,

  listChecks: function() {
    ListDownAllFilesAndFetchData((fileList) => {
      GetEachContentFromFile.call(this, fileList);
    });
  },
  
  loop: function() {
    setInterval(() => {
      this.listChecks();
    }, 1000 * 20);
  },

  logs: function(checkData, state, alertWanted) {
    const dataToBeLogged = {
      check: checkData,
      state: state,
      outcome: this.checkOutcome,
      alert: alertWanted,
      time: Date.now(),
    };

    Logs.appendLogs(checkData.id, dataToBeLogged, (err) => {
      if (err) {
        console.log("Error: Unable to log activities to file");
      } else {
        console.log("Data logged in file successfully");
      }
    });
  },

  init: function() {
    console.log("Workers thread started!");
    this.loop();
  },
};

function initWorkers() {
  worker.init.bind(worker)();
}

export default { init: initWorkers };
