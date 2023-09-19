import { readData } from "../lib/data.js";

async function verifyToken(token, phone) {
  if (!(typeof token === "string" && token.trim().length > 0))
    return { error: "No token found!", isAuthorized: false };

  const { error, data: tokenData } = await readData("tokens", token);
  if (error) return { error, isAuthorized: false };

  if (tokenData.phone === phone && tokenData.expiresAt > Date.now())
    return { error: false, isAuthorized: true };
  
  return { error: "Provided token has been expired", isAuthorized: false };
}

export default verifyToken;
