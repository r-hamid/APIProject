import { __dirname } from "../constants.js";
import { openFile, readFileData, deleteWholeFile, deleteDataFromFile, writeDataToFile, closeFileAfterWritingData, listDirList } from "./helperFunc.js";

function createFile(dir, file, data, callback) {
  // opening file and if not exists creating one
  openFile(`${__dirname}/.data/${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
    if (err) {
      callback(err);
      return;
    }

    writeDataToFile(data, fileDescriptor, (err) => {
      if (err) callback(err);
      else
        closeFileAfterWritingData(fileDescriptor, callback);
    });
  });
}

function readData(dir, file, callback) {
  readFileData(`${__dirname}/.data/${dir}/${file}.json`, (err, data) => {
    if (err) callback(err);
    else callback(null, data);
  });
}

function updateFileContent(dir, file, data, callback) {
  // opening file to deal with data
  openFile(`${__dirname}/.data/${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
    if (err) callback(err);
    deleteDataFromFile(fileDescriptor, () => {
      writeDataToFile(data, fileDescriptor, (err) => {
        if (err) callback(err);
        closeFileAfterWritingData(fileDescriptor, callback);
      });
    });
  });
}

function deleteFile(dir, file, callback) {
  deleteWholeFile(`${__dirname}/.data/${dir}/${file}.json`, (err) => {
    if (err) callback(err);
    else callback(false);
  });
}

function listFilesInADir(dir, callback) {
  listDirList(`${__dirname}/.data/${dir}`, (err, fileList) => {
    if (!err) {
      if (fileList.length > 0) {
        callback(fileList);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
}

export {
  readData,
  deleteFile,
  createFile,
  listFilesInADir,
  updateFileContent,
};
