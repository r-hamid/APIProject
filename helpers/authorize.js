import { readData } from "../lib/data.js";

const verifyToken = (token, phone, callback) => {
  if (!(typeof token === "string" && token.trim().length > 0)) {
    callback(false);
    return;
  }

  readData("tokens", token, (err, data) => {
    if (err && !data) {
      callback(false);
      return;
    }

    const tokenData = JSON.parse(data);
    if (tokenData.phone === phone && tokenData.expiresAt > Date.now()) callback(true);
    else callback(false);
  });
};

export default verifyToken;
