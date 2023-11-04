import { getTemplateByName } from "../helpers/templateManagement.js";
import { APIMethods } from "../constants.js";

const htmlRouteHandlers = {
  //:- Front End Rendering Handlers
  index: async (data) => {
    const { method } = data;
    if (method !== APIMethods.GET)
      return { statusCode: 502, payload: { message: "This method is not allowed" } };

    const templateData = {
      "body.class": "index",
      "head.title": "Monitoring Domain Availability - Made Simple",
      "head.description": "We offer free, simple HTTP/HTTPS sites of all kinds. When your site goes down, we'll send you a text to let you know.",
      "global.projectTitle": "Uptime Monitoring",
    };
    const { error, data: htmlData } = await getTemplateByName("index", templateData);
    if (error && !data) return { statusCode: 500, payload: null, contentType: "html" };

    return { statusCode: 200, payload: htmlData, contentType: "html" };
  },

  //:- Creating/Adding New User Handler
  accountCreate: async (data) => {
    const { method } = data;
    if (method !== APIMethods.GET)
      return { statusCode: 502, payload: { message: "This method is not allowed" } };

    const templateData = {
      "body.class": "accountCreate",
      "head.title": "Create New Account",
      "head.description": "Signing up for our platform is simple and only takes couple of seconds.",
      "global.projectTitle": "Uptime Monitoring",
    };
    const { error, data: htmlData } = await getTemplateByName("accountCreate", templateData);
    if (error && !data) return { statusCode: 500, payload: null, contentType: "html" };

    return { statusCode: 200, payload: htmlData, contentType: "html" };
  },

  //:- Logging user in
  accountLogin: async (data) => {
    const { method } = data;
    if (method !== APIMethods.GET)
      return { statusCode: 502, payload: { message: "This method is not allowed" } };
  },
};

const htmlRoutes = {
  "account/login": htmlRouteHandlers.accountLogin,
  "account/create": htmlRouteHandlers.accountCreate,
  "": htmlRouteHandlers.index,
};

export { htmlRouteHandlers, htmlRoutes };
