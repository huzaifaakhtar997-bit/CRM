import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  apiVersion: "v1",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "fallback_jwt_secret_key_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  hubspotEncryptionKey: process.env.HUBSPOT_ENCRYPTION_KEY || "fallback_encryption_key_change_me_!",
  emailProvider: process.env.EMAIL_PROVIDER || "resend",
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS || "CRM <noreply@crm.local>",
  resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET || "",
};
