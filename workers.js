import { CONSOLE_COLORS, CONSOLE_CONSTANTS } from "./constants.js";
import {
  ListDownAllFilesAndFetchData,
  getFileContent,
  validateData,
  parseDataToSendRequest,
} from "./helpers/workers.js";
import Logs from "./lib/logs.js";

class Worker {
  checkOutcome;

  isOutComeSent;

  checkData;

  constructor(fileName) {
    this.isOutComeSent = false;
    this.checkOutcome = {
      error: null,
      responseCode: 0,
    };

    this.startProcessingCheck(fileName);
  }

  startProcessingCheck(fileName) {
    const data = this.getFileContentFromFileName(fileName);
    if (!data) return;

    const isValidated = validateData(data);
    if (!isValidated) return;

    parseDataToSendRequest.call(this, data);
  }

  getFileContentFromFileName(fileName) {
    const data = getFileContent(fileName);
    return data;
  }

  logs(checkData, state, alertWanted) {
    const dataToBeLogged = {
      check: checkData,
      state: state,
      outcome: this.checkOutcome,
      alert: alertWanted,
      time: Date.now(),
    };

    Logs.appendLogs(checkData.id, dataToBeLogged, (err) => {
      if (err) {
        console.log(CONSOLE_COLORS.RED, `${CONSOLE_CONSTANTS.WORKER} Error: Unable to log activities to file`);
      } else {
        console.log(CONSOLE_COLORS.GREEN, `${CONSOLE_CONSTANTS.WORKER} Data logged in file successfully`);
      }
    });
  }
}

class WorkerParent {
  async processChecks() {
    console.log("Inside workers");
    const { error, fileList } = await ListDownAllFilesAndFetchData();
    if (!error && fileList.length > 0) {
      fileList.forEach((fileName) => new Worker(fileName.replace('.json', '')));
    }
  }

  initWorker() {
    setInterval(() => {
      this.processChecks();
    }, 1000 * 5);
  }
}

// const worker = {
//   checkOutcome: {
//     error: null,
//     responseCode: 0,
//   },
//   isOutComeSent: false,

//   listChecks: function() {
//     ListDownAllFilesAndFetchData((fileList) => {
//       GetEachContentFromFile.call(this, fileList);
//     });
//   },
  
//   loop: function() {
//     setInterval(() => {
//       this.listChecks();
//     }, 1000 * 20);
//   },

//   logs: function(checkData, state, alertWanted) {
//     const dataToBeLogged = {
//       check: checkData,
//       state: state,
//       outcome: this.checkOutcome,
//       alert: alertWanted,
//       time: Date.now(),
//     };

//     Logs.appendLogs(checkData.id, dataToBeLogged, (err) => {
//       if (err) {
//         console.log(CONSOLE_COLORS.RED, "Error: Unable to log activities to file");
//       } else {
//         console.log("Data logged in file successfully");
//       }
//     });
//   },

//   init: function() {
//     console.log(CONSOLE_COLORS.BLUE, `${CONSOLE_CONSTANTS.WORKER} Workers thread started!`);
//     this.loop();
//   },
// };

// function initWorkers() {
//   worker.init.bind(worker)();
// }

export default WorkerParent;
