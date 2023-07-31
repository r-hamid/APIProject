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

    console.log(CONSOLE_COLORS.BLUE, `${CONSOLE_CONSTANTS.WORKER} ${fileName} check is being processed`);
    this.startProcessingCheck(fileName);
  }

  async startProcessingCheck(fileName) {
    const data = await this.getFileContentFromFileName(fileName);
    if (!data) return;

    const isValidated = validateData(data);
    if (!isValidated) return;

    parseDataToSendRequest.call(this, data);
  }

  async getFileContentFromFileName(fileName) {
    const data = await getFileContent(fileName);
    return data;
  }

  async logs(checkData, state, alertWanted) {
    const dataToBeLogged = {
      check: checkData,
      state: state,
      outcome: this.checkOutcome,
      alert: alertWanted,
      time: Date.now(),
    };

    const { error } = await Logs.appendLogs(checkData.id, dataToBeLogged);
    if (error) {
      console.log(CONSOLE_COLORS.RED, `${CONSOLE_CONSTANTS.WORKER} Error: Unable to log activities to file`);
    } else {
      console.log(CONSOLE_COLORS.GREEN, `${CONSOLE_CONSTANTS.WORKER} Data logged in file successfully`);
    }
  }
}

class WorkerParent {
  async processChecks() {
    const { error, fileList } = await ListDownAllFilesAndFetchData();

    if (error) console.log(CONSOLE_COLORS.RED, `${CONSOLE_CONSTANTS.WORKER} ${error}`);
    else {
      fileList.forEach((fileName) => new Worker(fileName.replace('.json', '')));
    }
  }

  async initWorker() {
    console.log(CONSOLE_COLORS.BLUE, `${CONSOLE_CONSTANTS.WORKER} Wokers started for checks added by user`);
    await this.processChecks();

    setInterval(async () => {
      await this.processChecks();
    }, 1000 * 60);
  }
}

export default WorkerParent;
