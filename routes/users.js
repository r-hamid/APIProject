import { userRoutesAcceptedMethods } from "../constants.js";
import hashPassword from "../helpers/hashingPassword.js";
import { readData, createFile, deleteFile, updateFileContent } from "../lib/data.js";
import authorizeUser from "../helpers/authorize.js";

// User RouteHandler defined
export const userRouteHandlers = {
  users: (data, callback) => {
    const { method } = data;

    if (userRoutesAcceptedMethods.indexOf(method) > -1) {
      userRouteHandlers[method.toLowerCase()](data, callback);
    } else {
      callback(405, { message: "This method is not allowed for user." })
    }
  },

  get: (data, callback) => {
    // Getting Phone from Query Object
    const { queryParams, headers } = data;
    const { phone } = queryParams;
    const { token } = headers;

    authorizeUser(token, phone, (isAuthorized) => {
      if (!isAuthorized) {
        callback(401, { message: "unauthorized" });
        return;
      }

      if (!(typeof phone === "string" && phone.length === 14)) {
        callback(400, { message: "No valid phone number provided for user search" });
        return;
      }
  
      readData("users", phone, (err, data) => {
        if (err) {
          callback(404, { message: "No user found against provided phone number" });
        } else {
          console.log("phone number mentioned in query params", phone);
          if (data) {
            callback(200, { message: "User found successfully!", data: JSON.parse(data) });
          } else {
            callback(500, { message: "Invalid data format found!" })
          }
        }
      });
    });
  },

  // Adding new user to database
  post: (data, callback) => {
    // Getting all the fields are making sure they exists
    const { body } = data;
    let { firstName, lastName, phone, password, tosAgreement } = body;

    // Fields Validation
    firstName = typeof(firstName) === "string" && firstName.trim().length > 0 ? firstName : false;
    lastName = typeof(lastName) === "string" && lastName.trim().length > 0 ? lastName : false;
    phone = typeof(phone) === "string" && phone.trim().length > 0 ? phone : false;
    password = typeof(password) === "string" && password.trim().length > 0 ? password : false;
    tosAgreement = typeof(tosAgreement) === "boolean" ? tosAgreement : false;

    // Returning error and terminating function
    if (!(firstName && lastName && phone && password && tosAgreement)) {
      callback(400, { message: "Required fields are missing!" });
      return;
    }

    password = hashPassword(password);
    if (typeof password === "boolean") {
      callback(400, "Password cannot be hashed");
      return;
    }

    const userData = {
      firstName,
      lastName,
      phone,
      password,
      tosAgreement,
    };

    readData("users", phone, (err, data) => {
      if (data && !err) {
        callback(400, { message: "User with this phone number already exists." });
        return;
      }

      createFile("users", phone, userData, (err, data) => {
        if (err)
          callback(500, { message: "Cannot insert this user." });
        else
          callback(200, { message: "User created successfully!", data: userData });
      });
    });
  },

  put: (data, callback) => {
    const { queryParams, body, headers } = data;
    const { phone } = queryParams;
    const { firstName, lastName, password } = body;
    const { token } = headers;

    // Checking whether phone is present in query parameters
    if (!(typeof phone === "string" && phone.length > 0)) {
      callback(400, { message: "Please provide a valid phone number " });
      return;
    }

    // Checking whether we recieve any data to update or not
    if (!(firstName || lastName || password)) {
      callback(400, { message: "body should not be empty!" });
      return;
    }

    authorizeUser(token, phone, (isAuthorized) => {
      if (!isAuthorized) {
        callback(401, { message: "unauthorized" });
        return;
      }

      // Updating data after reading that specific user from file
      readData("users", phone, (err, data) => {
        if (err) {
          callback(400, { message: "No user exists against provided phone number" });
          return;
        }

        const userData = JSON.parse(data);
        if (firstName) {
          userData.firstName = firstName;
        }

        if (lastName) {
          userData.lastName = lastName;
        }

        if (password) {
          userData.password = hashPassword(password);
        }

        updateFileContent("users", phone, userData, (err) => {
          if (err) {
            callback(500, { message: "Unable to update the user right now" });
          } else {
            callback(200, { message: "User updated successfully!", data: userData });
          }
        });
      });
    });
  },

  delete: (data, callback) => {
    const { queryParams, headers } = data;
    const { phone } = queryParams;
    const { token } = headers;

    authorizeUser(token, phone, (isAuthorized) => {
      if (!isAuthorized) {
        callback(401, { message: "unauthorized" });
        return;
      }

      if (!(typeof phone === "string" && phone.length === 14)) {
        callback(400, { message: "No valid phone number provided for user search" });
        return;
      }

      // Reading user from provided data
      readData("users", phone, (err, userData) => {
        if (err && !userData) {
          callback(404, { message: "User not found" });
          return;
        }
        const parsedUserData = JSON.parse(userData);
        deleteFile("users", parsedUserData.phone, (err) => {
          if (err) {
            callback(500, { message: "Unable to delete the file, please try again in a while." });
            return;
          }
          const { checks } = parsedUserData;
          if (typeof checks === "object" && checks instanceof Array && checks.length > 0) {
            // Deleting all checks for user
            let deletionErrors = false;
            let checksDeleted = 0;

            checks.forEach((check) => {
              deleteFile("checks", check, (err) => {
                if (err) {
                  deletionErrors = true;
                }

                checksDeleted++;
                if (checksDeleted === checks.length) {
                  if (deletionErrors) {
                    callback(500, { message: "Could not delete check file. Please try again later" });
                  } else {
                    callback(200, { message: "User deleted successfully!" });
                  }
                }
              });
            });
          }
        });
      });
    });
  },
};

// List of routes
export const userRoutes = {
  users: userRouteHandlers.users,
};
