import { userRouteHandlers, userRoutes } from "./users.js";
import { tokenRouteHandlers, tokenRoutes } from "./tokens.js";
import { checkRouteHandler, checksRoutes } from "./checks.js";

// Defining route handlers with default not found route
export const routeHandlers = {
  notFound: (_data) => {
    return { statusCode: 404, payload: { message: "No such route exists!" }, };
  },

  ping: async (_data) => {
    return { statusCode: 200, payload: { message: "I am still alive." }, };
  },

  ...userRouteHandlers,
  ...tokenRouteHandlers,
  ...checkRouteHandler,
};

// List of routes
export const routes = {
  ping: routeHandlers.ping,
  ...userRoutes,
  ...tokenRoutes,
  ...checksRoutes,
};
