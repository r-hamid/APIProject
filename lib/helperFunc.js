import { writeFile, close, open, readFileSync, ftruncate, unlink, readdirSync, appendFile } from "fs";

// Closing file after writing data to file
function closeFileAfterWritingData(fileDescriptor, callback) {
  close(fileDescriptor, (err) => {
    if (!err) callback(false);
    else callback('Error while closing file');
  });
}

// writing data to file
function writeDataToFile(data, fileDescriptor, callback) {
  writeFile(fileDescriptor, JSON.stringify(data), (err) => {
    if (err) callback('Error while writing to new file');
    else callback(false);
  });
}

// Opening file with path
function openFile(filePath, fileAccess, callback) {
  open(filePath, fileAccess, (err, fileDescriptor) => {
    if (!(!err && fileDescriptor)) callback('File already exists');
    else callback(err, fileDescriptor);
  });
}

// Reading file content
function readFileData(filePath) {
  const data = readFileSync(filePath, "utf-8");
  return data;
}

// Delete all data from file
function deleteDataFromFile(fileDescriptor, callback) {
  ftruncate(fileDescriptor, (err) => {
    if (err) callback('unable to delete all data from file');
    else callback(false);
  });
}

// Delete file from system
function deleteWholeFile(filePath, callback) {
  unlink(filePath, (err) => {
    if (err) callback("Error: Unable to delete file from system");
    else callback(false);
  })
}

//List all files from specific directory
function listDirList(dirPath) {
  const data = readdirSync(dirPath, { encoding: "utf-8" });
  return data;
}

// Append data to file with new line
function appendDataIntoFile(fileDescriptor, data, callback) {
  appendFile(fileDescriptor, `${JSON.stringify(data)}\n`, function(err) {
    if (err) {
      callback("unable to append data into file");
    } else {
      callback(false);
    }
  });
}

export {
  openFile,
  listDirList,
  readFileData,
  deleteWholeFile,
  writeDataToFile,
  deleteDataFromFile,
  appendDataIntoFile,
  closeFileAfterWritingData,
};
