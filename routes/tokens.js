import { tokenRoutesAcceptedMethods } from "../constants.js";
import hashPassword from "../helpers/hashingPassword.js";
import generateToken from "../helpers/generateToken.js";
import { readData, createFile, deleteFile, updateFileContent } from "../lib/data.js";

// User RouteHandler defined
export const tokenRouteHandlers = {
  tokens: (data, callback) => {
    const { method } = data;

    if (tokenRoutesAcceptedMethods.indexOf(method) > -1) {
      tokenRouteHandlers[method.toLowerCase()](data, callback);
    } else {
      callback(405, { message: "This method is not allowed for user." })
    }
  },

  // Getting token details by token
  get: (data, callback) => {
    const { queryParams } = data;
    let { token } = queryParams;

    // Token is required
    token = (typeof token === "string" && token.trim().length > 0) ? token.trim() : false;
    if (!token) {
      callback(400, { message: "Token not found in the request" });
      return;
    }

    readData("tokens", token, (err, data) => {
      if (err && !data) {
        callback(404, { message: "No token found against provided value" });
        return;
      }

      const { token, expiresAt, phone } = JSON.parse(data);
      if (expiresAt <= Date.now()) {
        callback(401, { message: "Your authentication session has expired!" });
        return;
      }

      readData("users", phone, (err, userData) => {
        if (err && !userData) {
          callback(404, { message: "User not found against provided token" });
          return;
        }

        const { firstName, lastName } = JSON.parse(userData);
        callback(200, { message: "Token with user details", data: { firstName, lastName, token, phone } });
      });
    });
  },

  // Creating new token for user
  post: (data, callback) => {
    const { body } = data;
    let { phone, password } = body;

    phone = (typeof phone === "string" && phone.trim().length > 0) ? phone : false;
    password = (typeof password === "string" && password.trim().length > 0) ? password : false;

    if (!phone && !password) {
      callback(400, { message: "" });
      return;
    }

    readData("users", phone, (err, userData) => {
      if (!(!err && userData)) {
        callback(400, { message: "User credentials are not correct" });
        return;
      }

      userData = JSON.parse(userData);
      // Check if hashed password does not match
      password = hashPassword(password);
      if (password !== userData.password) {
        callback(400, { message: "User credentials are not correct!!" });
        return;
      }

      const token = generateToken();
      const tokenObject = {
        token,
        phone,
        expiresAt: Date.now() + 1000 * 60 * 60,
      };
      // Saving data into file
      createFile("tokens", token, tokenObject, (err) => {
        if (err) {
          callback(500, { message: "Cannot create token yet. Please try again in a while." });
        } else {
          delete userData.password;
          delete userData.tosAgreement;
          callback(200, { message: "Logged in successfully", data: { token: token, ...userData } });
        }
      });
    });
  },

  put: (data, callback) => {
    // Getting data from API request
    const { queryParams, body } = data;
    let { isExtend } = body;
    let { token } = queryParams;

    token = (typeof token === "string" && token.trim().length > 0) ? token.trim() : false;
    isExtend = (typeof isExtend === "boolean") ? isExtend : false;

    if (!token && !isExtend) {
      callback(400, { message: "Either required parameters are missing! Or cannot extend the token" });
      return;
    }

    readData("tokens", token, (err, tokenData) => {
      if (err && !tokenData) {
        callback(404, { message: "Token does not exists" });
        return;
      }

      const parsedTokenData = JSON.parse(tokenData);
      if (parsedTokenData.expiresAt <= Date.now()) {
        callback(401, { message: "Token has been expired! Cannot extend the expiry" });
        return;
      }

      parsedTokenData.expiresAt = Date.now();
      updateFileContent("tokens", token, parsedTokenData, (err) => {
        if (err) {
          callback(500, { message: "Unable to update token expiry" });
        } else {
          callback(200, { message: "Token expiry updated successfully", data: parsedTokenData });
        }
      });
    });
  },

  delete: (data, callback) => {
    // Will get only token in query params
    const { queryParams } = data;
    let { token } = queryParams;

    token = (typeof token === "string" && token.trim(). length > 0 ) ? token.trim() : false;
    if (!token) {
      callback(400, { message: "Token does not found in the request you made" });
      return;
    }

    readData("tokens", token, (err, data) => {
      if (err && !data) {
        callback(404, { message: "Token not found in our system" });
        return;
      }

      deleteFile("tokens", token, (err) => {
        if (err) {
          callback(500, { message: "Something went wrong. Cannot delete token at this moment" });
        } else {
          callback(200, { message: "Token deleted successfully" });
        }
      });
    });
  },
};

// List of routes
export const tokenRoutes = {
  tokens: tokenRouteHandlers.tokens,
};
