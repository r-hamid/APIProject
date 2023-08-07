import { createHmac } from "crypto";

import Config from "../config.js";

function hashPassword(password) {
  if (!(typeof password === "string" && password.length > 0)) return false;

  const hashPassword = createHmac("sha256", Config.hashSecret)
    .update(password)
    .digest("hex");
  return hashPassword;
}

export default hashPassword;
