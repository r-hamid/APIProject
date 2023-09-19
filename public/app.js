const API_METHODS = ["GET", "POST", "PUT", "DELETE"];

const app = {};

app.config = {
  session: false,
};

app.config.request = function(path, method, queryStringObject, payload, headers, callback) {
  // Validation and Defaults
  path = typeof path === "string" ? path : "";
  method = typeof method === "string" && API_METHODS.includes(method) ? method : "GET";
  queryStringObject = typeof queryStringObject === "object" && queryStringObject !== null ? queryStringObject : {};
  payload = typeof payload === "object" && payload !== null ? payload : {};
  callback = typeof callback === "function" ? callback : false;
  headers = typeof headers === "object" && headers !== null ? headers : {};

  // ordering queryStringObject and adding it to path
  if (Object.keys(queryStringObject).length > 0) {
    let apiUrl = "";
    for(let queryKey in queryStringObject) {
      if (queryStringObject.hasOwnProperty(queryKey)) {
        if (apiUrl.length === 0)
          apiUrl = `${path}?${queryKey}=${queryStringObject[queryKey]}`;
        else
          apiUrl = `${apiUrl}&${queryKey}=${queryStringObject[queryKey]}`;
      }
    }

    path = apiUrl;
  }

  // Creating request and opening for API call
  const request = new XMLHttpRequest();
  request.open(method, path);

  // Adding headers to XMLHttpRequest
  request.setRequestHeader("Content-Type", "application/json");
  if (Object.keys(headers).length > 0) {
    for (const headerKey in headers) {
      if (headers.hasOwnProperty(headerKey))
        request.setRequestHeader(headerKey, headers[headerKey]);
    }
  }

  // Adding authorization header
  const { session } = app.config;
  if (typeof session === "object" && session !== null)
    request.setRequestHeader("token", session.id);

  // Adding listener as the state of xhr request change
  request.onreadystatechange = function() {
    if (request.readyState === XMLHttpRequest.DONE) {
      const status = request.status;
      const body = request.statusText;

      if (callback) {
        try {
          const parsedData = JSON.parse(body);
          callback(status, parsedData);
        } catch (err) {
          callback(status, false);
        }
      }
    }
  }

  // Sending request to back end
  const payloadStringified = JSON.stringify(payload);

  // Sending request
  request.send(payloadStringified);
}
