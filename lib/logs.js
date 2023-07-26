import { openFile, closeFileAfterWritingData, appendDataIntoFile } from "./helperFunc.js";
import { __dirname } from "../constants.js";

const logs = {
  // Appending worker logs to files
  appendLogs: function(fileName, data, callback) {
    openFile(`${__dirname}/.logs/${fileName}.log`, "a", (err, fileDescriptor) => {
      if (err) {
        callback("Unable to open file of logs");
        return;
      }

      appendDataIntoFile(fileDescriptor, data, (err) => {
        if (err) callback(err);
        else closeFileAfterWritingData(fileDescriptor, callback);
      });
    });
  },
};

export default logs;
