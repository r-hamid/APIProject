import { tokenRoutesAcceptedMethods } from "../constants.js";
import hashPassword from "../helpers/hashingPassword.js";
import generateToken from "../helpers/generateToken.js";
import { readData, createFile, deleteFile, updateFileContent } from "../lib/data.js";

// User RouteHandler defined
export const tokenRouteHandlers = {
  tokens: async (data) => {
    const { method } = data;

    if (tokenRoutesAcceptedMethods.indexOf(method) > -1) {
      const { statusCode, payload } = await tokenRouteHandlers[method.toLowerCase()](data);
      return { statusCode, payload };
    } else {
      return { statusCode: 405, payload: { message: "This method is not allowed for user." }, };
    }
  },

  // Getting token details by token
  get: async (data) => {
    const { queryParams } = data;
    let { token } = queryParams;

    // Token is required
    token = (typeof token === "string" && token.trim().length > 0) ? token.trim() : false;
    if (!token)
      return { statusCode: 400, payload: { message: "Token not found in the request" }, };

    const { error: readTokenError, data: tokenData } = await readData("tokens", token);
    if (readTokenError && !tokenData)
      return { statusCode: 404, payload: { message: "No token found against provided value" }, };

    const { token: savedToken, expiresAt, phone } = tokenData;
    if (expiresAt <= Date.now())
      return { statusCode: 401, payload: { message: "Your authentication session has expired!" }, };

    const { error: readUserError, data: userData } = await readData("users", phone);
    if (readUserError && !userData) {
      callback(404, { message: "User not found against provided token" });
      return;
    }

    const { firstName, lastName } = userData;
    const tokenUpdatePayload = {
      message: "Token with user details",
      data: { firstName, lastName, token: savedToken, phone },
    };
  
    return { statusCode: 200, payload: tokenUpdatePayload };
  },

  // Creating new token for user
  post: async (data) => {
    const { body } = data;
    let { phone, password } = body;

    phone = (typeof phone === "string" && phone.trim().length > 0) ? phone : false;
    password = (typeof password === "string" && password.trim().length > 0) ? password : false;

    if (!phone && !password)
      return { statusCode: 400, payload: { message: "Request payload is not valid." }, };

    const { error: readUserDataError, data: userData } = await readData("users", phone);

    if (readUserDataError && !userData)
      return { statusCode: 400, payload: { message: "User credentials are not correct" }, };

    // Check if hashed password does not match
    password = hashPassword(password);
    if (password !== userData.password)
      return { statusCode: 400, payload: { message: "User credentials are not correct!!" }, };

    const token = generateToken();
    const tokenObject = {
      token,
      phone,
      expiresAt: Date.now() + 1000 * 60 * 60,
    };

    // Saving data into file
    const { error: createTokenError } = await createFile("tokens", token, tokenObject);
    if (createTokenError)
      return { statusCode: 500, payload: { message: "Cannot create token yet. Please try again in a while." }, };

    delete userData.password;
    delete userData.tosAgreement;

    const userTokenPayload = {
      message: "Logged in successfully",
      data: { token: token, ...userData },
    };
    
    return { statusCode: 200, payload: userTokenPayload };
  },

  put: async (data) => {
    // Getting data from API request
    const { queryParams, body } = data;
    let { isExtend } = body;
    let { token } = queryParams;

    token = (typeof token === "string" && token.trim().length > 0) ? token.trim() : false;
    isExtend = (typeof isExtend === "boolean") ? isExtend : false;

    if (!token && !isExtend)
      return { statusCode: 400, payload: { message: "Either required parameters are missing! Or cannot extend the token" }, };

    const { error: readTokenError, data: tokenData } = await readData("tokens", token);
    if (readTokenError && !tokenData)
      return { statusCode: 404, payload: { message: "Token does not exists" }, };

    if (tokenData.expiresAt <= Date.now())
      return { statusCode: 401, payload: { message: "Token has been expired! Cannot extend the expiry" }, };

    tokenData.expiresAt = Date.now();
    const { error: updateTokenError } = await updateFileContent("tokens", token, tokenData);
    if (updateTokenError)
      return { statusCode: 500, payload: { message: "Unable to update token expiry" }, };

    const tokenPayload = {
      message: "Token expiry updated successfully",
      data: tokenData,
    }
    return { statusCode: 200, payload: tokenPayload };
  },

  delete: async (data) => {
    // Will get only token in query params
    const { queryParams } = data;
    let { token } = queryParams;

    token = (typeof token === "string" && token.trim(). length > 0 ) ? token.trim() : false;
    if (!token)
      return { statusCode: 400, payload: { message: "Token does not found in the request you made" }, };

    const { error: readTokenError, data: tokenData } = await readData("tokens", token);
    if (readTokenError && !tokenData)
      return { statusCode: 404, payload: { message: "Token not found in our system" }, };

    const { error: deleteTokenError } = await deleteFile("tokens", token);
    if (deleteTokenError)
      return { statusCode: 500, payload: { message: "Something went wrong. Cannot delete token at this moment" }, };

    return { statusCode: 200, payload: { message: "Token deleted successfully" }, };
  },
};

// List of routes
export const tokenRoutes = {
  "api/tokens": tokenRouteHandlers.tokens,
};
