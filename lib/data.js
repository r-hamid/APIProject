import { gzipSync, unzipSync } from "zlib";

import { __dirname } from "../constants.js";
import { openFile, readFileData, deleteWholeFile, deleteDataFromFile, writeDataToFile, closeFileAfterWritingData, listDirList } from "./helperFunc.js";

async function createFile(dir, file, data) {
  const { error, fileDescriptor } = await openFile(`${__dirname}/.data/${dir}/${file}.json`, "wx");
  if (error) return { error };

  const { error: fileWriteError } = await writeDataToFile(data, fileDescriptor);
  if (fileWriteError) return { error: fileWriteError };

  const { error: fileCloseError } = await closeFileAfterWritingData(fileDescriptor);
  if (fileCloseError) return { error: fileCloseError };

  return { error: false };
}

async function readData(dir, file) {
  const { data, error } = await readFileData(`${__dirname}/.data/${dir}/${file}.json`);
  if (error) return { error, data: null };

  return { error: false, data };
}

async function updateFileContent(dir, file, data) {
  const path = `${__dirname}/.data/${dir}/${file}.json`;
  const { error, fileDescriptor } = await openFile(path, 'r+');
  if (error) return { error };

  const { error: removeFileDataError } = await deleteDataFromFile(path);
  if (removeFileDataError) return { error: removeFileDataError };

  const { error: writeDataToFileError } = await writeDataToFile(data, fileDescriptor);
  if (writeDataToFileError) return { error: writeDataToFile };

  const { error: fileCloseError } = await closeFileAfterWritingData(fileDescriptor);
  if (fileCloseError) return { error: fileCloseError };

  return { error: false };
}

async function deleteFile(dir, file, callback) {
  const { error } = await deleteWholeFile(`${__dirname}/.data/${dir}/${file}.json`);
  if (error) return { error };
  
  return { error: false };
}

async function listFilesInADir(dir) {
  const { error, data } = await listDirList(`${__dirname}/.data/${dir}`);
  if (error) return { error, fileList: null };

  const indexOfGitKeep = data.indexOf(".gitkeep");
  data.splice(indexOfGitKeep, 1);
  if (data.length === 0) return { error: `No files found in ${dir}`, fileList: null };

  return { error: false, fileList: data };
}

async function listLogs() {
  const { error, data } = await listDirList(`${__dirname}/.logs`);
  if (error) return { error, fileList: null };

  const indexOfGitKeep = data.indexOf(".gitkeep");
  data.splice(indexOfGitKeep, 1);
  if (data.length === 0) return { error: `No files found in ${dir}`, fileList: null };

  return { error: false, fileList: data };
}

function compressStringAndConvertToBase64(dataString) {
  const compressedString = gzipSync(dataString);
  const compressStringInBase64 = compressedString.toString("base64");

  return compressStringInBase64;
}

function uncompressData(dataString) {
  const fileData = Buffer.from(dataString, "base64");
  const uncompressString = unzipSync(fileData);
  const uncompressedData = uncompressString.toString();

  return uncompressedData;
}

export {
  listLogs,
  readData,
  deleteFile,
  createFile,
  uncompressData,
  listFilesInADir,
  updateFileContent,
  compressStringAndConvertToBase64,
};
