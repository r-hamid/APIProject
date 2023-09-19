import { openFile, closeFileAfterWritingData, appendDataIntoFile, writeDataToFile, deleteDataFromFile, readLogFileData } from "./helperFunc.js";
import { __dirname } from "../constants.js";
import { listLogs, compressStringAndConvertToBase64, uncompressData } from "./data.js";

class Logs {
  // Appending worker logs to files
  async appendLogs(fileName, data) {
    const { error, fileDescriptor } = await openFile(`${__dirname}/.logs/${fileName}.log`, "a");
    if (error) return { error: "Unable to open file of logs" };

    const { error: appendDataToFileError } = await appendDataIntoFile(fileDescriptor, data);
    if (appendDataToFileError) return { error: appendDataToFileError };
    
    const { error: closeFileError } = await closeFileAfterWritingData(fileDescriptor);
    if (closeFileError) return { error: closeFileError };

    return { error: false };
  }

  // Getting all logs for specific log
  async getLogFiles(isCompressedFileIncluded = false) {
    const { error, fileList } = await listLogs();
    if (error && !fileList) return { error, fileList: null };

    const finalFileList = [];
    fileList.forEach((file) => {
      if (isCompressedFileIncluded) {
        if (file.includes(".log")) finalFileList.push(file.replace(".log", ""));
        if (file.includes(".gz.b64")) finalFileList.push(file.replace(".gz.b64", ""));
      } else {
        finalFileList.push(file.replace(".log", ""));
      }
    });

    if (finalFileList.length === 0) return { error: `File list does not contain any file with provided log id ${logId}`, fileList: [] };
    return { error: false, fileList: finalFileList };
  }

  // Compressing data and writing to new file
  async compressDataAndCreateFile(logId) {
    const { error, data } = await readLogFileData(`${__dirname}/.logs/${logId}.log`);
    if (error && !data) return { error };

    const compressedData = compressStringAndConvertToBase64(JSON.stringify(data));

    const { error: fileOpenError, fileDescriptor } = await openFile(`${__dirname}/.logs/${logId}_${Date.now()}.gz.b64`, "wx");
    if (fileOpenError) return { error: fileOpenError };

    const { error: fileWritingError } = await writeDataToFile(compressedData, fileDescriptor);
    if (fileWritingError) return { error: fileWritingError };

    const { error: closeFileError } = await closeFileAfterWritingData(fileDescriptor);
    if (closeFileError) return { error: closeFileError };

    const { error: logFileClearError } = await this.emptyLogFile(logId);
    if (logFileClearError) return { error: logFileClearError };

    return { error: false };
  }

  // Empty the log file after data is compressed successfully
  async emptyLogFile(logId) {
    const { error, fileDescriptor } = await openFile(`${__dirname}/.logs/${logId}.log`, "r+");
    if (error) return { error };

    const { error: appendDataToFileError } = await deleteDataFromFile(fileDescriptor);
    if (appendDataToFileError) return { error: appendDataToFileError };

    const { error: closeFileError } = await closeFileAfterWritingData(fileDescriptor);
    if (closeFileError) return { error: closeFileError };

    return { error: false };
  }

  async decompressData(fileName) {
    const { data, error } = await readLogFileData(`${__dirname}/.logs/${fileName}`);
    if (error && !data) return { error };

    const unCompressedData = uncompressData(data);

    console.log({ unCompressedData });
  }
}

export default Logs;
