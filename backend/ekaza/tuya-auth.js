import { createHmac, createHash } from "node:crypto";

export const sha256 = (value) => createHash("sha256").update(value).digest("hex");
export const hmacSha256 = (secret, value) => createHmac("sha256", secret).update(value).digest("hex").toUpperCase();

export function createTuyaSignature({ clientId, clientSecret, method, path, body = "", timestamp, accessToken = "" }) {
  const stringToSign = `${method}\n${sha256(body)}\n\n${path}`;
  return hmacSha256(clientSecret, `${clientId}${accessToken}${timestamp}${stringToSign}`);
}
