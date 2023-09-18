import { writeFile, open, readFile, unlink, readdir, appendFile } from "fs/promises";

// Closing file after writing data to file
async function closeFileAfterWritingData(fileDescriptor) {
  try {
    await fileDescriptor.close();
    return { error: false };
  } catch (error) {
    return { error: "Something went wrong while closing file. Please try again in a while" };
  }
}

// writing data to file
async function writeDataToFile(data, fileDescriptor) {
  try {
    await writeFile(fileDescriptor, JSON.stringify(data));
    return { error: false };
  } catch (error) {
    return { error: "Something went wrong while writing to file. Please try again in a while" };
  }
}

// Opening file with path
async function openFile(filePath, fileAccess) {
  try {
    const fileDescriptor = await open(filePath, fileAccess);
    return { error: false, fileDescriptor };
  } catch (error) {
    return { error: "Something went wrong while opening file. Please try again in a while", fileDescriptor: null };
  }
}

// Reading file content
async function readFileData(filePath) {
  try {
    const data = await readFile(filePath, "utf-8");
    return { error: false, data: JSON.parse(data) };
  } catch (error) {
    return { error: "Something went wrong while reading data. Please try again in a while", data: null };
  }
}

// Delete all data from file
async function deleteDataFromFile(fileDescriptor) {
  try {
    await fileDescriptor.truncate();
    return { error: false };
  } catch (error) {
    return { error: "Something went wrong while clearing file data. Please try again in a while" };
  }
}

// Delete file from system
async function deleteWholeFile(filePath) {
  try {
    await unlink(filePath);
    return { error: false };
  } catch (error) {
    return { error: "Something went wrong while deleting file. Please try again in a while" };
  }
}

//List all files from specific directory
async function listDirList(dirPath) {
  try {
    const data = await readdir(dirPath, { encoding: "utf-8" });
    return { error: false, data };
  } catch (error) {
    return { data: null, error: "Something went wrong while reading directory. Please try again in a while" };
  }
}

// Append data to file with new line
async function appendDataIntoFile(fileDescriptor, data) {
  try {
    await appendFile(fileDescriptor, `${JSON.stringify(data)}\n`);
    return { error: false };
  } catch (error) {
    return { error: "Something went wrong while appending data to file. Please try again in a while" };
  }
}

// Reading file content
async function readLogFileData(filePath) {
  try {
    const data = await readFile(filePath, { encoding: "utf-8" });
    return { error: false, data };
  } catch (error) {
    return { error: "Something went wrong while reading data. Please try again in a while", data: null };
  }
}

// Reading data from public directory
async function getPublicAssetFileContent(filePath) {
  try {
    const data = await readFile(filePath);
    return { error: false, data };
  } catch (error) {
    return { error: "Something went wrong while reading data. Please try again in a while", data: null };
  }
}

export {
  openFile,
  listDirList,
  readFileData,
  readLogFileData,
  deleteWholeFile,
  writeDataToFile,
  deleteDataFromFile,
  appendDataIntoFile,
  getPublicAssetFileContent,
  closeFileAfterWritingData,
};
