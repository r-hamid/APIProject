import { randomBytes } from "crypto";

function generateToken(tokenLength = 32) {
  const token = randomBytes(tokenLength).toString("hex");
  return token;
}

export default generateToken;
