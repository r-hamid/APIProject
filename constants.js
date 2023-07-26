import path from "path";
import { fileURLToPath } from "url";

// All API Methods
const APIMethods = {
  POST: 'POST',
  GET: 'GET',
  PUT: 'PUT',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
};

// Defining dirname for module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// User routes acceptable methods
const userRoutesAcceptedMethods = [APIMethods.GET, APIMethods.POST, APIMethods.PUT, APIMethods.DELETE];

// Token routes acceptable methods
const tokenRoutesAcceptedMethods = [APIMethods.GET, APIMethods.POST, APIMethods.PUT, APIMethods.DELETE];

// Checks routes acceptable methods
const checksRoutesAcceptedMethods = [APIMethods.GET, APIMethods.POST, APIMethods.PUT, APIMethods.DELETE];
const protocolsAcceptedForChecks = [...checksRoutesAcceptedMethods];
const checkProtocol = { HTTP: "http", HTTPS: "https" };
const checkFilesDirName = `checks`;

// Workers Constants
const CheckURLState = { UP: "up", DOWN: "down" };

export {
  __dirname,
  userRoutesAcceptedMethods,
  tokenRoutesAcceptedMethods,
  checksRoutesAcceptedMethods,
  protocolsAcceptedForChecks,
  APIMethods,
  checkProtocol,
  checkFilesDirName,
  CheckURLState,
};
