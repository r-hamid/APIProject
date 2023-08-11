import { userRoutesAcceptedMethods } from "../constants.js";
import hashPassword from "../helpers/hashingPassword.js";
import { readData, createFile, deleteFile, updateFileContent } from "../lib/data.js";
import authorizeUser from "../helpers/authorize.js";

// User RouteHandler defined
export const userRouteHandlers = {
  users: async (data) => {
    const { method } = data;

    if (userRoutesAcceptedMethods.indexOf(method) > -1) {
      const { statusCode, payload } = await userRouteHandlers[method.toLowerCase()](data);
      return { statusCode, payload };
    } else {
      return { statusCode: 405, payload: { message: "This method is not allowed for user." } };
    }
  },

  get: async (data) => {
    // Getting Phone from Query Object
    const { queryParams, headers } = data;
    const { phone } = queryParams;
    const { token } = headers;

    const { isAuthorized } = await authorizeUser(token, phone);
    if (!isAuthorized)
      return { statusCode: 401, payload: { message: "unauthorized" } };

    if (!(typeof phone === "string" && phone.length === 14))
      return { statusCode: 400, payload: { message: "No valid phone number provided for user search" } };
  
    const { error: readUserError, data: userData } = await readData("users", phone);

    if (readUserError && !userData)
      return { statusCode: 404, payload: { message: "No user found against provided phone number" } };

    return { statusCode: 200, payload: { message: "User found successfully!", data: userData } };
  },

  // Adding new user to database
  post: async (data) => {
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
    if (!(firstName && lastName && phone && password && tosAgreement))
      return { statusCode: 400, payload: { message: "Required fields are missing!" } };

    password = hashPassword(password);
    if (typeof password === "boolean")
      return { statusCode: 400, payload: { message: "Password cannot be hashed" } };

    const userData = {
      firstName,
      lastName,
      phone,
      password,
      tosAgreement,
    };

    const { error: readUserDataError, data: readUserData } = await readData("users", phone);
    if (readUserData && !readUserDataError)
      return { statusCode: 400, payload: { message: "User with this phone number already exists." } };

    const { error: createUserError } = await createFile("users", phone, userData);
    if (createUserError)
      return { statusCode: 500, payload: { message: "Cannot insert this user." } };

    return { statusCode: 200, payload: { message: "User created successfully!", data: userData } };
  },

  put: async (data) => {
    const { queryParams, body, headers } = data;
    const { phone } = queryParams;
    const { firstName, lastName, password } = body;
    const { token } = headers;

    // Checking whether phone is present in query parameters
    if (!(typeof phone === "string" && phone.length > 0))
      return { statusCode: 400, payload: { message: "Please provide a valid phone number " } };

    // Checking whether we recieve any data to update or not
    if (!(firstName || lastName || password))
      return { statusCode: 400, payload: { message: "body should not be empty!" } };

    const { isAuthorized } = await authorizeUser(token, phone);
    if (!isAuthorized)
      return { statusCode: 401, payload: { message: "unauthorized" } };

    // Updating data after reading that specific user from file
    const { error: readUserError, data: userData } = await readData("users", phone);
    if (readUserError)
      return { statusCode: 400, payload: { message: "No user exists against provided phone number" } };

    if (firstName) userData.firstName = firstName;
    if (lastName) userData.lastName = lastName;
    if (password) userData.password = hashPassword(password);

    const { error: updateUserError } = await updateFileContent("users", phone, userData);
    if (updateUserError)
      return { statusCode: 500, payload: { message: "Unable to update the user right now" } };

    return { statusCode: 200, payload: { message: "User updated successfully!", data: userData } };
  },

  delete: async (data) => {
    const { queryParams, headers } = data;
    const { phone } = queryParams;
    const { token } = headers;

    const { isAuthorized } = await authorizeUser(token, phone);
    if (!isAuthorized)
      return { statusCode: 401, payload: { message: "unauthorized" } };

    if (!(typeof phone === "string" && phone.length === 14))
      return { statusCode: 400, payload: { message: "No valid phone number provided for user search" }};

    // Reading user from provided data
    const { error: readUserError, data: userData } = await readData("users", phone);
    if (readUserError && !userData)
      return { statusCode: 404, payload: { message: "User not found" } };

    const { error: deleteUserError } = await deleteFile("users", userData.phone);
    if (deleteUserError)
      return { statusCode: 500, payload: { message: "Unable to delete the file, please try again in a while." } };

    const { checks } = userData;
    if (typeof checks === "object" && checks instanceof Array && checks.length > 0) {
      // Deleting all checks for user
      let checksDeleted = 0;
      let checkUserError = "";

      checks.forEach(async (check) => {
        const { error: deleteCheckError } = await deleteFile("checks", check);
        if (deleteCheckError) checkUserError = `${checkUserError} ${deleteCheckError} on ${check} \n`;

        if (checksDeleted === checks.length) {
          if (deletionErrors)
            return { statusCode: 500, payload: { message: "Could not delete check file. Please try again later" } };
          else
            return { statusCode: 200, payload: { message: "User deleted successfully!" } };
        }
        checksDeleted++;
      });
    } else
      return { statusCode: 200, payload: { message: "User deleted successfully!" } };
  },
};

// List of routes
export const userRoutes = {
  users: userRouteHandlers.users,
};
