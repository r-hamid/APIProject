import { parse } from "url";
import { StringDecoder } from "string_decoder";

import { routes, routeHandlers } from "../routes/index.js";

function unifiedServer(req, res) {
  // Parsing URL to get request metadata
  const parsedURL = parse(req.url, true);
  const parsedPath = parsedURL.pathname.replaceAll('/', '');

  // String decoder to fetch data
  const decoder = new StringDecoder("utf-8");
  const recievedDataBuffer = {
    headers: req.headers,
    method: req.method,
    queryParams: parsedURL.query,
    trimmedPath: parsedURL.path,
    body: "",
  };

  // Checking for recieving the payload from request
  req.on("data", (data) => {
    recievedDataBuffer.body += decoder.write(data);
  });

  // Making sure that we have recieved all the data
  req.on("end", async () => {
    recievedDataBuffer.body += decoder.end();

    if (recievedDataBuffer.body)
      recievedDataBuffer.body = JSON.parse(recievedDataBuffer.body);

    // Checking for route if found will move to relevant routeHandler
    if (routes[parsedPath.includes("public") ? "public" : parsedPath]) {
      const { statusCode, payload, contentType } = await routeHandlers[
        parsedPath === "" ? "index" : (parsedPath.includes("public") ? "public" : parsedPath)
      ](recievedDataBuffer);
      const contentTypeRecieved = typeof contentType === "string" ? contentType : "json";

      let payloadStringified = "";
      switch(contentTypeRecieved) {
        case "json":
          res.setHeader("Content-Type", "application/json");
          payloadStringified = payload ? JSON.stringify(payload) : "";
          break;
        case "html":
          res.setHeader("Content-Type", "text/html");
          payloadStringified = typeof payload === "string" ? payload : "";
          break;
        case "css":
          res.setHeader("Content-Type", "text/css");
          payloadStringified = typeof payload !== "undefined" ? payload : "";
          break;
        case "js":
          res.setHeader("Content-Type", "text/javascript");
          payloadStringified = typeof payload !== "undefined" ? payload : "";
          break;
        case "ico":
          res.setHeader("Content-Type", "image/x-icon");
          payloadStringified = typeof payload !== "undefined" ? payload : "";
          break;
        case "jpg":
          res.setHeader("Content-Type", "image/jpeg");
          payloadStringified = typeof payload !== "undefined" ? payload : "";
          break;
        case "png":
          res.setHeader("Content-Type", "image/x-png");
          payloadStringified = typeof payload !== "undefined" ? payload : "";
          break;
        default:
          console.log("Default switch statement");
          break;
      }

      res.writeHead(statusCode || 200);
      res.end(payloadStringified);
    } else {
      const { statusCode, payload } = routeHandlers.notFound(recievedDataBuffer);

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode || 404);
      res.end(payload ? JSON.stringify(payload) : undefined);
    }
  });
}

export default unifiedServer;
