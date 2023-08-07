import { userRouteHandlers, userRoutes } from "./users.js";
import { tokenRouteHandlers, tokenRoutes } from "./tokens.js";
import { checkRouteHandler, checksRoutes } from "./checks.js";

// Defining route handlers with default not found route
export const routeHandlers = {
  notFound: (_data, callback) => {
    callback(404, { message: "No such route exists!" });
  },
  sample: (_data, callback) => {
    callback(406, { name: "Hamid Rasool Testing" });
  },
  ping: (_data, callback) => {
    callback(200, { message: "I am still alive." })
  },
  ...userRouteHandlers,
  ...tokenRouteHandlers,
  ...checkRouteHandler,
};

// List of routes
export const routes = {
  sample: routeHandlers.sample,
  ping: routeHandlers.ping,
  ...userRoutes,
  ...tokenRoutes,
  ...checksRoutes,
};
