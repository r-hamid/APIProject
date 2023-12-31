import { CONSOLE_COLORS, CONSOLE_CONSTANTS } from "./constants.js";
import {
  ListDownAllFiles,
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

    const { error } = await new Logs().appendLogs(checkData.id, dataToBeLogged);
    if (error) {
      console.log(CONSOLE_COLORS.RED, `${CONSOLE_CONSTANTS.WORKER} Error: Unable to log activities to file`);
    } else {
      console.log(CONSOLE_COLORS.BLUE, `${CONSOLE_CONSTANTS.WORKER} Data logged in file successfully`);
    }
  }
}

class WorkerParent {
  async processChecks() {
    const { error, fileList } = await ListDownAllFiles();

    if (error) console.log(CONSOLE_COLORS.RED, `${CONSOLE_CONSTANTS.WORKER} ${error}`);
    else {
      fileList.forEach((fileName) => new Worker(fileName.replace(".json", "")));
    }
  }

  async initWorker() {
    console.log(CONSOLE_COLORS.BLUE, `${CONSOLE_CONSTANTS.WORKER} Wokers started for checks added by user`);
    await this.processChecks();

    setInterval(async () => {
      await this.processChecks();
    }, 1000 * 60);

    setInterval(async () => {
      await this.rotateLogs();
    }, 1000 * 60 * 60 * 24);
  }

  // Rotating logs to save memory and compress them
  async rotateLogs() {
    const logs = new Logs();

    const { error, fileList } = await logs.getLogFiles();
    if (error && fileList.length === 0) console.log(CONSOLE_COLORS.RED, `${CONSOLE_CONSTANTS.WORKER} ${error}`);

    let logFileCompressionError = ""
    fileList.forEach(async (fileName) => {
      const { error } = await logs.compressDataAndCreateFile(fileName);
      if (error) logFileCompressionError = `${logFileCompressionError} \n ${error} in ${fileName}.log`;
    });

    if (logFileCompressionError)
      console.log(CONSOLE_COLORS.RED, `${error}`);
    else
      console.log(CONSOLE_COLORS.BLUE, `${CONSOLE_CONSTANTS.WORKER} Files compressed successfully`);
  }

  // See uncompressed data
  async seeUncompressedLogs() {
    const logs = new Logs();
    await logs.decompressData("45cbec3974a2c3be1d8c9b8c9ba85c7a1360d507_1691602285462.gz.b64");
  }
}

export default WorkerParent;
