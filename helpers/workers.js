import { parse } from "url";
import http from "http";
import https from "https";
import { readFileSync } from "fs";

import sendSMS from "../helpers/sendSMS.js";
import { listFilesInADir, readData, updateFileContent } from "../lib/data.js";
import {
  checkFilesDirName,
  __dirname,
  protocolsAcceptedForChecks,
  checkProtocol,
  CheckURLState,
} from "../constants.js";

function alertUserToStatusChange(newCheckData) {
  const { method, state, protocol, url, phone } = newCheckData;

  const checkUrl = `${protocol}://${url}`;
  const messageBody = `Alert: Your check for ${method.toUpperCase()} ${checkUrl} is currently ${state}`;

  sendSMS(phone, messageBody, (err) => {
    if(!err){
      console.log("Success: User was alerted to a status change in their check, via sms: ",msg);
    } else {
      console.log("Error: Could not send sms alert to user who had a state change in their check",err);
    }
  });
}

function processCheckOutcome(checkData) {
  const { successCodes, lastChecked, state } = checkData;

  const currentState = !this.checkOutcome.error &&
    this.checkOutcome.responseCode &&
    successCodes.indexOf(this.checkOutcome.responseCode) > -1 ? "up" : "down";

  const alertWanted = lastChecked && state !== currentState ? true : false;

  const newCheckData = JSON.parse(JSON.stringify(checkData));
  newCheckData.state = currentState;
  newCheckData.lastChecked = Date.now();

  this.logs(newCheckData, currentState, alertWanted);
  updateFileContent("checks", newCheckData.id, newCheckData, (err) => {
    if (err) console.log("Error trying to save updates to one of the checks");
    else {
      if (alertWanted) {
        alertUserToStatusChange(newCheckData);
      } else {
        console.log("Check outcome has not changed, no alert needed");
      }
    }
  });
}

function callbackForRequestError(checkData, err, message) {
  this.checkOutcome.error = {
    error: true,
    value: typeof message === "string" && message.length > 0 ? message : err,
  };

  if (!this.isOutComeSent) {
    processCheckOutcome.call(this, checkData);
    this.isOutComeSent = true;
  }
}

function validateData(checkData) {
  // Verifying the request body
  let { state, lastChecked, protocol, url, method, successCodes, timeOutSeconds } = checkData;

  protocol = (typeof protocol === "string" && checkProtocol[protocol.trim().toUpperCase()]) ? protocol.trim() : false;
  url = (typeof url === "string" && url.trim().length > 0) ? url.trim() : false;
  method = (typeof method === "string" && protocolsAcceptedForChecks.indexOf(method.trim().toUpperCase()) > -1) ? method.trim() : false;
  successCodes = (typeof successCodes === "object" && successCodes instanceof Array && successCodes.length > 0) ? successCodes : false;
  timeOutSeconds = (typeof timeOutSeconds === "number" && timeOutSeconds > 0 && timeOutSeconds <= 5) ? timeOutSeconds : false;

  checkData.state = typeof state === "string" && CheckURLState[state] ? state : "down";
  checkData.lastChecked = typeof lastChecked === "number" && lastChecked > 0 ? lastChecked : false;

  if (!(protocol && url && method && successCodes && timeOutSeconds)) {
    console.log(`${checkData.id} Check Data is not validated`);
    return false;
  }
  return true;
}

function parseDataToSendRequest(checkData) {
  let { protocol, url, method, timeOutSeconds } = checkData;

  // Adding details to send request
  const requestDetails = parse(`${protocol}://${url}`, true);
  requestDetails.method = method.toUpperCase();
  if (protocol === "https") {
    requestDetails.key = readFileSync(`${__dirname}/https/key.pem`);
    requestDetails.cert = readFileSync(`${__dirname}/https/cert.pem`);
  }

  // deciding protocol
  const requestProtocol = protocol === "http" ? http : https;

  // Sending request
  const requestData = requestProtocol.request(requestDetails, (res) => {
    const { statusCode } = res;

    this.checkOutcome.responseCode = statusCode;
    if (!this.isOutComeSent) {
      processCheckOutcome.call(this, checkData);
      this.isOutComeSent = true;
    }
  });

  // Request status while hit error
  requestData.on("error", (err) => callbackForRequestError.call(this, checkData, err));

  // Request status whehn timed out
  requestData.on("timeout", (err) => callbackForRequestError.call(this, checkData, err, "timeout"));

  // Sending request
  requestData.end();
}

function GetEachContentFromFile(fileList) {
  fileList.forEach((fileName) => {
    fileName = fileName.replace('.json', '');
    readData(checkFilesDirName, fileName, (err, checkData) => {
      if (err && !checkData) console.log(`Error while reading ${fileName}`);
      else {
        const parsedData = JSON.parse(checkData);
        const isDataValidated = validateData(parsedData);
        if (isDataValidated) {
          parseDataToSendRequest.call(this, parsedData);
        }
      }
    });
  });
}

function ListDownAllFilesAndFetchData(callback) {
  listFilesInADir(checkFilesDirName, (filesList) => {
    if (typeof filesList === "object" && filesList instanceof Array) {
      callback(filesList);
    } else {
      console.log("No files found in the checks directory");
    }
  });
}

export {
  ListDownAllFilesAndFetchData,
  GetEachContentFromFile,
};