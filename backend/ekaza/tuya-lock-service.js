import { createCipheriv, createDecipheriv, randomInt } from "node:crypto";
import { TuyaError } from "./tuya-errors.js";

export function decryptTicketKey(ticketKeyHex, clientSecret) {
  if (Buffer.byteLength(clientSecret, "utf8") !== 32) throw new TuyaError("invalid_lock_configuration", "A chave da Tuya não possui o tamanho exigido para a fechadura.");
  const decipher = createDecipheriv("aes-256-ecb", Buffer.from(clientSecret, "utf8"), null);
  decipher.setAutoPadding(true);
  return Buffer.concat([decipher.update(Buffer.from(ticketKeyHex, "hex")), decipher.final()]).toString("utf8");
}

export function encryptLockPassword(code, ticketKey) {
  if (!/^\d{6}$/.test(code)) throw new TuyaError("invalid_access_code", "O código temporário precisa ter seis dígitos.");
  const cipher = createCipheriv("aes-128-ecb", Buffer.from(ticketKey, "utf8"), null);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(code, "utf8"), cipher.final()]).toString("hex").toUpperCase();
}

export function generateTemporaryCode() { return String(randomInt(100000, 1000000)); }
