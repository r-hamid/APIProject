import { request } from "https";
import { stringify } from "querystring";
import { readFileSync } from "fs";
import { parse } from "url";

import envConfig from "../config.js";
import { APIMethods, __dirname } from "../constants.js";

const sendSMSViaTwilio = (phone, body, callback) => {
  phone = (typeof phone === "string" && phone.trim().length === 14) ? phone.trim() : false;
  body = (typeof body === "string" && body.trim().length > 0 && body.trim().length < 1600) ? body.trim() : false;

  if (!phone && !body) {
    callback("Missing required parameters or provided parameters are invalid");
    return;
  }

  // Creating payload for request
  const requestPayload = {
    From: envConfig.twilio.fromPhone,
    To: phone,
    Body: body,
  };
  const stringifiedPayload = stringify(requestPayload);

  // Creating request configurations
  const requestConfig = parse(`https://api.twilio.com/2010-04-01/Accounts/${envConfig.twilio.accountSid}/Messages.json`, true);
  requestConfig.method = APIMethods.POST;
  requestConfig.headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Content-Length": Buffer.byteLength(stringifiedPayload),
  };
  requestConfig.key = readFileSync(`${__dirname}/https/key.pem`);
  requestConfig.cert = readFileSync(`${__dirname}/https/cert.pem`);
  requestConfig.auth = `${envConfig.twilio.accountSid}:${envConfig.twilio.authToken}`;

  // Creating Request now
  const sendSMSRequest = request(requestConfig, (res) => {
    const status = res.statusCode;

    if (status === 200 || status === 201) {
      callback(false);
    } else {
      callback("error with status code: ", status);
    }
  });

  // Adding error listener
  sendSMSRequest.on("error", (err) => {
    callback(err);
  });

  // Adding payload to send request
  sendSMSRequest.write(stringifiedPayload);

  // Sending request
  sendSMSRequest.end();
};

export default sendSMSViaTwilio;
