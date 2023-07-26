import { randomBytes } from "crypto";

const generateToken = (tokenLength = 32) => {
  const token = randomBytes(tokenLength).toString("hex");
  return token;
};

export default generateToken;
