import { checksRoutesAcceptedMethods, checkProtocol, protocolsAcceptedForChecks } from "../constants.js";
import authorizeToken from "../helpers/authorize.js";
import { readData, createFile, updateFileContent, deleteFile } from "../lib/data.js";
import envConfig from "../config.js";
import generateToken from "../helpers/generateToken.js";

export const checkRouteHandler = {
  checks: async (data) => {
    const { method } = data;

    if (checksRoutesAcceptedMethods.indexOf(method) > -1) {
      const { statusCode, payload } = await checkRouteHandler[method.toLowerCase()](data);
      return { statusCode, payload };
    } else {
      return { statusCode: 405, payload: { message: "This method is not allowed for user." } };
    }
  },

  // Getting check details from check id
  get: async (data) => {
    // Getting token & checkId from request bodu
    const { headers, queryParams } = data;
    let { checkId } = queryParams;
    let { token } = headers;

    // Checking whether checkId exists or not
    checkId = (typeof checkId === "string" && checkId.trim().length > 0) ? checkId.trim() : false;
    token = (typeof token === "string" && token.trim().length > 0) ? token.trim() : false;

    // Reading token details from request
    const { error: readTokenError, data: tokenData } = await readData("tokens", token);
    if (readTokenError && !tokenData)
      return { statusCode: 404, payload: { message: "Token does not exists or expired" } };

    // Get User details from token's phone number
    const { error: readUserError, data: userData } = await readData("users", tokenData.phone);
    if (readUserError && !userData)
      return { statusCode: 404, payload: { message: "User not found or invalid token" } };

    // Make sure that checkId associated with current user
    if (!(
      typeof userData.checks === "object"
      && userData.checks instanceof Array
      && userData.checks.length > 0
      && userData.checks.indexOf(checkId) > -1
    ))
      return { statusCode: 404, payload: { message: "Check id not linked with you" } };

    // Get check data and return it
    const { error: readCheckError, data: checkData } = await readData("checks", checkId);
    if (readCheckError && !checkData)
      return { statusCode: 404, payload: { message: "No check found against provided identifier" } };

    return { statusCode: 200, payload: { message: "Check data fetched successfully", data: checkData } };
  },

  // Adding new checks in the system
  post: async (data) => {
    const { body, headers } = data;
    const { token } = headers;
    let { protocol, url, method, successCodes, timeOutSeconds } = body;

    // Verifying the request body
    protocol = (typeof protocol === "string" && checkProtocol[protocol.trim().toUpperCase()]) ? protocol.trim() : false;
    url = (typeof url === "string" && url.trim().length > 0) ? url.trim() : false;
    method = (typeof method === "string" && protocolsAcceptedForChecks.indexOf(method.trim().toUpperCase()) > -1) ? method.trim() : false;
    successCodes = (typeof successCodes === "object" && successCodes instanceof Array && successCodes.length > 0) ? successCodes : false;
    timeOutSeconds = (typeof timeOutSeconds === "number" && timeOutSeconds > 0 && timeOutSeconds <= 5) ? timeOutSeconds : false;

    if (!(protocol && url && method && successCodes && timeOutSeconds))
      return { statusCode: 400, payload: { message: "Required fields are missing" } };

    // Generating Check Object to store
    const checksData = {
      id: generateToken(8),
      protocol,
      url,
      method,
      successCodes,
      timeOutSeconds,
    };

    // Getting user phone from token
    const { error: readTokenError , data: tokenData } = await readData("tokens", token);
    if (readTokenError && !tokenData)
      return { statusCode: 404, payload: { message: "provided token does not exists or expired" } };

    // authorize token and then move forward
    const { isAuthorized } = await authorizeToken(token, tokenData.phone);
    if (!isAuthorized)
      return { statusCode: 403, payload: { message: "Forbidden to access this endpoint" } };

    // Reading userData to make sure that checks are not exceeding limit
    const { error: readUserDataError, data: userData } = await readData("users", tokenData.phone);
    if (readUserDataError && !userData)
      return { statusCode: 404, payload: { message: "No user found against this token" } };

    if (
      typeof userData.checks === "object" &&
      userData.checks instanceof Array &&
      userData.checks.length >= envConfig.totalChecksAllowed
    )
      return { statusCode: 400, payload: { message: "Your check limit has reached" } };

    // Storing checks details in file
    const { error: createCheckError } = await createFile(
      "checks",
      checksData.id,
      { ...checksData, userPhone: userData.phone }
    );
    if (createCheckError)
      return { statusCode: 500, payload: { message: "Unable to create new check. Please try again later" } };

    // Storing check id into user files to keep track
    const existingChecks = userData.checks || [];
    const newUserData = {
      ...userData,
      checks: [...existingChecks, checksData.id ],
    };

    // Saving checks into user file
    const { error: updateUserError } = await updateFileContent("users", userData.phone, newUserData);
    if (updateUserError)
      return { statusCode: 500, payload: { message: "Unable to update the user content" } };

    return { statusCode: 200, payload: { message: "New check created successfully", data: checksData } };
  },

  // Updating check details
  put: async (data) => {
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

    if (!(token && checkId && (protocol || url || method || successCodes || timeOutSeconds)))
      return { statusCode: 400, payload: { message: "Required fields are missing" } };

    // Getting token details from token
    const { error: readTokenError, data: tokenData } = await readData("tokens", token);
    if (readTokenError && !tokenData)
      return { statusCode: 404, payload: { message: "Token not found!" } };

    // Verifying that provided token is valid and has not expired
    const { isAuthorized } = await authorizeToken(token, tokenData.phone);
    if (!isAuthorized)
      return { statusCode: 401, payload: { message: "Provided token has expired" } };

    // Getting user details from token
    const { error: readUserData, data: userData } = await readData("users", tokenData.phone);
    if (readUserData && !userData)
      return { statusCode: 404, payload: { message: "User not found against provided token" } };

    // Checking whether this checkId is associated with authorized user
    if (!(
      typeof userData.checks === "object"
      && userData.checks instanceof Array
      && userData.checks.length > 0
      && userData.checks.indexOf(checkId) > -1
    ))
      return { statusCode: 403, payload: { message: "Check id not linked with you" } };

    // Getting check details with checkId
    const { error: readCheckError, data: checkData } = await readData("checks", checkId);
    if (readCheckError && !checkData)
      return { statusCode: 404, payload: { message: "Check does not found" } };

    // Now parse the check and update provided fields
    if (protocol) checkData.protocol = protocol;
    if (url) checkData.url = url;
    if (method) checkData.method = method;
    if (successCodes) checkData.successCodes = successCodes;
    if (timeOutSeconds) checkData.timeOutSeconds = timeOutSeconds;

    // Updating check data in file
    const { error: updateCheckError } = await updateFileContent("checks", checkId, checkData);
    if (updateCheckError)
      return { statusCode: 500, payload: { message: "Could not update the check details at this moment" } };

    return { statusCode: 200, payload: { message: "Check details updated successfully", data: checkData } };
  },

  // Deleting Check by check id
  delete: async (data) => {
    const { queryParams, headers } = data;
    let { checkId } = queryParams;
    let { token } = headers;

    // Checking whether token and checkId exists or not
    checkId = (typeof checkId === "string" && checkId.trim().length > 0) ? checkId.trim() : false;
    token = (typeof token === "string" && token.trim().length > 0) ? token.trim() : false;

    if (!checkId && !token)
      return { statusCode: 400, payload: { message: "Missing required fields" } };

    // Getting token details
    const { error: readTokenError, data: tokenData } = await readData("tokens", token);
    if (readTokenError && !tokenData)
      return { statusCode: 404, payload: { message: "No token found against user" } };

    // authorize token using phone
    const { isAuthorized } = await authorizeToken(token, tokenData.phone);
    if (!isAuthorized)
      return { statusCode: 403, payload: { message: "User is forbidden from accessing this endpoint" } };

    // Getting user details from token
    const { error: readUserError, data: userData } = await readData("users", tokenData.phone);
    if (readUserError && !userData)
      return { statusCode: 404, payload: { message: "No user found against provided data" } };
          
    // Checking if check is associated with this user
    if (!(
      typeof userData.checks === "object"
      && userData.checks instanceof Array
      && userData.checks.length > 0
      && userData.checks.indexOf(checkId) > -1
    ))
      return { statusCode: 404, payload: { message: "Check id not linked with you" } };

    // Deleting check from user list
    const indexOfCheck = userData.checks.indexOf(checkId);
    userData.checks.splice(indexOfCheck, 1);

    // Updating content of user
    const { error: updateUserError } = await updateFileContent("users", tokenData.phone, userData);
    if (updateUserError)
      return { statusCode: 500, payload: { message: "Could not update user data at this moment." } };

    // Deleting check from file system
    const { error: deleteCheckError } = await deleteFile("checks", checkId);
    if (deleteCheckError)
      return { statusCode: 500, payload: { message: "Could not delete check at this moment." } };

    return { statusCode: 200, payload: { message: "Check deleted successfully" } };
  },
};

export const checksRoutes = {
  "api/checks": checkRouteHandler.checks,
};
