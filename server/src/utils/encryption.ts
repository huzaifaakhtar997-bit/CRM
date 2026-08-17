import crypto from "crypto";
import { config } from "../config/env";
import { AppError } from "../types/auth.types";

const ALGORITHM = "aes-256-gcm";

export function encryptToken(text: string): string {
  try {
    const key = crypto.scryptSync(config.hubspotEncryptionKey, "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    throw new AppError("Encryption failed", 500);
  }
}

export function decryptToken(encryptedText: string): string {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error("Invalid encrypted text format");
    }
    
    const key = crypto.scryptSync(config.hubspotEncryptionKey, "salt", 32);
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    throw new AppError("Decryption failed. The encryption key may be invalid or the data is corrupted.", 500);
  }
}
