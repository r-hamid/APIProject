import { userRouteHandlers, userRoutes } from "./users.js";
import { tokenRouteHandlers, tokenRoutes } from "./tokens.js";
import { checkRouteHandler, checksRoutes } from "./checks.js";

import { getTemplateByName } from "../helpers/templateManagement.js";
import { APIMethods } from "../constants.js";

// Defining route handlers with default not found route
export const routeHandlers = {
  //:- Front End Rendering Handlers
  index: async (data) => {
    const { method } = data;
    if (method !== APIMethods.GET)
      return { statusCode: 502, payload: { message: "This method is allowed" } };

    const templateData = {
      "body.title": "Hello World!",
      "body.class": "indexBody",
      "head.title": "Main Page",
      "head.description": "This is the main page for our Uptime tracker application.",
    };
    const { error, data: htmlData } = await getTemplateByName("index", templateData);
    if (error && !data) return { statusCode: 500, payload: null, contentType: "html" };

    return { statusCode: 200, payload: htmlData, contentType: "html" };
  },

  //:- JSON API Handlers
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
  "": routeHandlers.index,
  ping: routeHandlers.ping,
  ...userRoutes,
  ...tokenRoutes,
  ...checksRoutes,
};
