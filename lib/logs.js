import { openFile, closeFileAfterWritingData, appendDataIntoFile } from "./helperFunc.js";
import { __dirname } from "../constants.js";

class Logs {
  // Appending worker logs to files
  static async appendLogs(fileName, data) {
    const { error, fileDescriptor } = await openFile(`${__dirname}/.logs/${fileName}.log`, "a");
    if (error) return { error: "Unable to open file of logs" };

    const { error: appendDataToFileError } = await appendDataIntoFile(fileDescriptor, data);
    if (appendDataToFileError) return { error: appendDataToFileError };
    
    const { error: closeFileError } = await closeFileAfterWritingData(fileDescriptor);
    if (closeFileError) return { error: closeFileError };

    return { error: false };
  }
}

export default Logs;
