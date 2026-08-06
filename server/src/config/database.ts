import { PrismaClient } from "@prisma/client";

// Singleton Prisma Client instance to avoid multiple connection pools in dev
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});
