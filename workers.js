import { ListDownAllFilesAndFetchData, GetEachContentFromFile } from "./helpers/workers.js";
import Logs from "./lib/logs.js";
import { CONSOLE_COLORS, CONSOLE_CONSTANTS } from "./constants.js";

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
        console.log(CONSOLE_COLORS.RED, "Error: Unable to log activities to file");
      } else {
        console.log("Data logged in file successfully");
      }
    });
  },

  init: function() {
    console.log(CONSOLE_COLORS.BLUE, `${CONSOLE_CONSTANTS.WORKER} Workers thread started!`);
    this.loop();
  },
};

function initWorkers() {
  worker.init.bind(worker)();
}

export default { init: initWorkers };
