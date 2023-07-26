import { checksRoutesAcceptedMethods, checkProtocol, protocolsAcceptedForChecks } from "../constants.js";
import authorizeToken from "../helpers/authorize.js";
import { readData, createFile, updateFileContent, deleteFile } from "../lib/data.js";
import envConfig from "../config.js";
import generateToken from "../helpers/generateToken.js";

export const checkRouteHandler = {
  checks: (data, callback) => {
    const { method } = data;

    if (checksRoutesAcceptedMethods.indexOf(method) > -1) {
      checkRouteHandler[method.toLowerCase()](data, callback);
    } else {
      callback(405, { message: "This method is not allowed for user." })
    }
  },

  // Getting check details from check id
  get: (data, callback) => {
    // Getting token & checkId from request bodu
    const { headers, queryParams } = data;
    let { checkId } = queryParams;
    let { token } = headers;

    // Checking whether checkId exists or not
    checkId = (typeof checkId === "string" && checkId.trim().length > 0) ? checkId.trim() : false;
    token = (typeof token === "string" && token.trim().length > 0) ? token.trim() : false;

    // Reading token details from request
    readData("tokens", token, (err, tokenData) => {
      if (err && !tokenData) {
        callback(404, { message: "Token does not exists or expired" });
        return;
      }

      // Get User details from token's phone number
      const parsedTokenData = JSON.parse(tokenData);
      readData("users", parsedTokenData.phone, (err, userData) => {
        if (err && !userData) {
          callback(404, { message: "User not found or invalid token" });
          return;
        }

        // Make sure that checkId associated with current user
        const parsedUserData = JSON.parse(userData);
        if (!(typeof parsedUserData.checks === "object" && parsedUserData.checks instanceof Array && parsedUserData.checks.length > 0 && parsedUserData.checks.indexOf(checkId) > -1)) {
          callback(404, { message: "Check id not linked with you" });
          return;
        }

        // Get check data and return it
        readData("checks", checkId, (err, checkData) => {
          if (err && !checkData) {
            callback(404, { message: "No check found against provided identifier" });
          } else {
            callback(200, { message: "Check data fetched successfully", data: JSON.parse(checkData) });
          }
        });
      });
    });
  },

  // Adding new checks in the system
  post: (data, callback) => {
    const { body, headers } = data;
    const { token } = headers;
    let { protocol, url, method, successCodes, timeOutSeconds } = body;

    // Verifying the request body
    protocol = (typeof protocol === "string" && checkProtocol[protocol.trim().toUpperCase()]) ? protocol.trim() : false;
    url = (typeof url === "string" && url.trim().length > 0) ? url.trim() : false;
    method = (typeof method === "string" && protocolsAcceptedForChecks.indexOf(method.trim().toUpperCase()) > -1) ? method.trim() : false;
    successCodes = (typeof successCodes === "object" && successCodes instanceof Array && successCodes.length > 0) ? successCodes : false;
    timeOutSeconds = (typeof timeOutSeconds === "number" && timeOutSeconds > 0 && timeOutSeconds <= 5) ? timeOutSeconds : false;

    if (!(protocol && url && method && successCodes && timeOutSeconds)) {
      callback(400, { message: "Required fields are missing" });
      return;
    }

    // Generating Check Object to store
    const checksData = {
      id: generateToken(20),
      protocol,
      url,
      method,
      successCodes,
      timeOutSeconds,
    };

    // Getting user phone from token
    readData("tokens", token, (err, tokenData) => {
      if (err && !tokenData) {
        callback(404, { message: "provided token does not exists or expired" });
        return;
      }

      const parsedTokenData = JSON.parse(tokenData);
      
      // authorize token and then move forward
      authorizeToken(token, parsedTokenData.phone, (isUserAuthorized) => {
        if (!isUserAuthorized) {
          callback(403, { message: "Forbidden to access this endpoint" });
          return;
        }

        // Reading userData to make sure that checks are not exceeding limit
        readData("users", parsedTokenData.phone, (err, userData) => {
          if (err && !userData) {
            callback(404, { message: "No user found against this token" });
            return;
          }

          // Getting details about checks linked to this user
          const parsedUserData = JSON.parse(userData);
          if (
            typeof parsedUserData.checks === "object" &&
            parsedUserData.checks instanceof Array &&
            parsedUserData.checks.length >= envConfig.totalChecksAllowed
          ) {
            callback(400, { message: "Your check limit has reached" });
            return;
          }

          // Storing checks details in file
          createFile(
            "checks",
            checksData.id,
            { ...checksData, userPhone: parsedTokenData.phone },
            (err) => {
              if (err) {
                callback(500, { message: "Unable to create new check. Please try again later" });
                return;
              }

              // Storing check id into user files to keep track
              const existingChecks = parsedUserData.checks || [];
              const newUserData = {
                ...parsedUserData,
                checks: [...existingChecks, checksData.id ],
              };
              
              // Saving checks into user file
              updateFileContent("users", parsedUserData.phone, newUserData, (err) => {
                if (err) {
                  callback(500, { message: "Unable to update the user content" });
                } else {
                  callback(200, { message: "New check created successfully", data: checksData });
                }
              });
            }
          );
        });
      });
    });
  },

  // Updating check details
  put: (data, callback) => {
    const { headers, queryParams, body } = data;
    let { token } = headers;
    let { checkId } = queryParams;
    let { protocol, url, method, successCodes, timeOutSeconds } = body;

    // CheckId and token are require
    token = (typeof token === "string" && token.trim().length > 0) ? token.trim() : false;
    checkId = (typeof checkId === "string" && checkId.trim().length > 0) ? checkId.trim() : false;

    // One of the field should exists in body
    protocol = (typeof protocol === "string" && checkProtocol[protocol.trim().toUpperCase()]) ? protocol.trim() : false;
    url = (typeof url === "string" && url.trim().length > 0) ? url.trim() : false;
    method = (typeof method === "string" && protocolsAcceptedForChecks.indexOf(method.trim().toUpperCase()) > -1) ? method.trim() : false;
    successCodes = (typeof successCodes === "object" && successCodes instanceof Array && successCodes.length > 0) ? successCodes : false;
    timeOutSeconds = (typeof timeOutSeconds === "number" && timeOutSeconds > 0 && timeOutSeconds <= 5) ? timeOutSeconds : false;

    if (!(token && checkId && (protocol || url || method || successCodes || timeOutSeconds))) {
      callback(400, { message: "Required fields are missing" });
      return;
    }

    // Getting token details from token
    readData("tokens", token, (err, tokenData) => {
      if (err && !tokenData) {
        callback(404, { message: "Token not found!" });
        return;
      }

      // Verifying that provided token is valid and has not expired
      const parsedTokenData = JSON.parse(tokenData);
      authorizeToken(token, parsedTokenData.phone, (isUserAuthorized) => {
        if (!isUserAuthorized) {
          callback(401, { message: "Provided token has expired" });
          return;
        }

        // Getting user details from token
        readData("users", parsedTokenData.phone, (err, userData) => {
          if (err && !userData) {
            callback(404, { message: "User not found against provided token" });
            return;
          }

          // Checking whether this checkId is associated with authorized user
          const parsedUserData = JSON.parse(userData);
          if (!(typeof parsedUserData.checks === "object" && parsedUserData.checks instanceof Array && parsedUserData.checks.length > 0 && parsedUserData.checks.indexOf(checkId) > -1)) {
            callback(403, { message: "Check id not linked with you" });
            return;
          }

          // Getting check details with checkId
          readData("checks", checkId, (err, checkData) => {
            if (err && !checkData) {
              callback(404, { message: "Check does not found" });
              return;
            }

            // Now parse the check and update provided fields
            const parsedCheckData = JSON.parse(checkData);
            if (protocol) parsedCheckData.protocol = protocol;
            if (url) parsedCheckData.url = url;
            if (method) parsedCheckData.method = method;
            if (successCodes) parsedCheckData.successCodes = successCodes;
            if (timeOutSeconds) parsedCheckData.timeOutSeconds = timeOutSeconds;

            // Updating check data in file
            updateFileContent("checks", checkId, parsedCheckData, (err) => {
              if (err) {
                callback(500, { message: "Could not update the check details at this moment" });
              } else {
                callback(200, { message: "Check details updated successfully", data: parsedCheckData });
              }
            });
          });
        });

      });
    });
  },

  // Deleting Check by check id
  delete: (data, callback) => {
    const { queryParams, headers } = data;
    let { checkId } = queryParams;
    let { token } = headers;

    // Checking whether token and checkId exists or not
    checkId = (typeof checkId === "string" && checkId.trim().length > 0) ? checkId.trim() : false;
    token = (typeof token === "string" && token.trim().length > 0) ? token.trim() : false;

    if (!checkId && !token) {
      callback(400, { message: "Missing required fields" });
      return;
    }

    // Getting token details
    readData("tokens", token, (err, tokenData) => {
      if (err && !tokenData) {
        callback(404, { message: "No token found against user" });
        return;
      }
      const parsedTokenData = JSON.parse(tokenData);

      // authorize token using phone
      authorizeToken(token, parsedTokenData.phone, (isUserAuthorized) => {
        if (!isUserAuthorized) {
          callback(403, { message: "User is forbidden from accessing this endpoint" });
          return;
        }

        // Getting user details from token
        readData("users", parsedTokenData.phone, (err, userData) => {
          if (err && !userData) {
            callback(404, { message: "No user found against provided data" });
          }
          const parsedUserData = JSON.parse(userData);
          
          // Checking if check is associated with this user
          if (!(typeof parsedUserData.checks === "object" && parsedUserData.checks instanceof Array && parsedUserData.checks.length > 0 && parsedUserData.checks.indexOf(checkId) > -1)) {
            callback(404, { message: "Check id not linked with you" });
            return;
          }

          // Deleting check from user list
          const indexOfCheck = parsedUserData.checks.indexOf(checkId);
          parsedUserData.checks.splice(indexOfCheck, 1);

          // Updating content of user
          updateFileContent("users", parsedTokenData.phone, parsedUserData, (err) => {
            if (err) {
              callback(500, { message: "Could not update user data at this moment." });
              return;
            }

            // Deleting check from file system
            deleteFile("checks", checkId, (err) => {
              if (err) {
                callback(500, { message: "Could not delete check at this moment." });
              } else {
                callback(200, { message: "Check deleted successfully" });
              }
            });
          });
        });
      });
    });
  },
};

export const checksRoutes = {
  checks: checkRouteHandler.checks,
};
