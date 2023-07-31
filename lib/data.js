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

function readData(dir, file) {
  const data = readFileData(`${__dirname}/.data/${dir}/${file}.json`);
  if (data.length === 0) return { error: "No data found", data: null };
  return { error: false, data: JSON.parse(data) };
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

async function listFilesInADir(dir) {
  const data = listDirList(`${__dirname}/.data/${dir}`);
  return data;
}

export {
  readData,
  deleteFile,
  createFile,
  listFilesInADir,
  updateFileContent,
};
