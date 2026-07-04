import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard IV length
const AUTH_TAG_LENGTH = 16;

// Derive a 32-byte key from the ENCRYPTION_KEY environment variable.
// Falls back to JWT_ACCESS_SECRET but logs a warning. Never uses a hardcoded key.
const getEncryptionKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ENCRYPTION_KEY (or JWT_ACCESS_SECRET fallback) must be set and at least 32 characters. " +
      "Refusing to use a hardcoded default — set it in your .env file."
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
};

/**
 * Encrypts a plain text string using AES-256-GCM.
 * Output format: iv_hex:auth_tag_hex:encrypted_hex
 */
export function encryptToken(token: string): string {
  if (!token) return "";
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted string (iv_hex:auth_tag_hex:encrypted_hex) using AES-256-GCM.
 */
export function decryptToken(encryptedData: string): string {
  if (!encryptedData) return "";
  
  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }
  
  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted as any, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
