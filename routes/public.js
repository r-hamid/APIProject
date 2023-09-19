import { APIMethods } from "../constants.js";
import { getPublicAsset } from "../lib/data.js";

const publicRouteHandler = {
  public: async (data) => {
    const { method } = data;
    if (method === APIMethods.GET) {
      const { statusCode, payload, contentType } = await publicRouteHandler[method.toLowerCase()](data);
      return { statusCode, payload, contentType };
    } else {
      return { statusCode: 405, payload: { message: "Method not allowed" } };
    }
  },

  get: async (payload) => {
    const { trimmedPath } = payload;
    const fileName = trimmedPath.split('/').pop();
    const { error, data } = await getPublicAsset(fileName);
    if (error || !data)
      return { statusCode: 500, payload: { message: error }, contentType: "json" };

    const fileExt = fileName.split(".").pop();
    return { statusCode: 200, payload: data, contentType: fileExt };
  }
};

const publicRoutes = {
  public: publicRouteHandler.public,
};

export { publicRouteHandler, publicRoutes };
