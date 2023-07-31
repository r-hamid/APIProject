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
    body: "",
  };

  // Checking for recieving the payload from request
  req.on("data", (data) => {
    recievedDataBuffer.body += decoder.write(data);
  });

  // Making sure that we have recieved all the data
  req.on("end", () => {
    recievedDataBuffer.body += decoder.end();

    if (recievedDataBuffer.body)
      recievedDataBuffer.body = JSON.parse(recievedDataBuffer.body);

    // Checking for route if found will move to relevant routeHandler
    if (routes[parsedPath]) {
      routeHandlers[parsedPath](recievedDataBuffer, (statusCode, payload) => {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode || 200);
        res.end(payload ? JSON.stringify(payload) : undefined);
      });
    } else {
      routeHandlers.notFound(recievedDataBuffer, (statusCode, payload) => {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode || 404);
        res.end(payload ? JSON.stringify(payload) : undefined);
      });
    }
  });
}

export default unifiedServer;
