import app from "./app";
import { config } from "./config/env";
import { prisma } from "./config/database";

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log("✅ Successfully connected to PostgreSQL database via Prisma");

    app.listen(config.port, () => {
      console.log(`🚀 CRM Backend Server running in ${config.env} mode on http://localhost:${config.port}`);
      console.log(`📍 API Base URL: http://localhost:${config.port}/api/v1`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
