import express from "express";
import cors from "cors";
import apiRoutes from "./routes";
import webhookRoutes from "./routes/webhook.routes";
import { errorHandler } from "./middleware/error.middleware";
import { config } from "./config/env";

const app = express();

// Global Middlewares
app.use(cors({ origin: config.corsOrigin }));

// Webhook routes must be mounted BEFORE express.json() to get raw body, and before apiRoutes to skip JWT auth.
// express.raw() is applied per-route inside webhook.routes.ts itself.
app.use("/api/v1/webhooks", webhookRoutes);

// Apply JSON body parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API Routes under /api/v1
app.use("/api/v1", apiRoutes);

// Root health & info route
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "CRM API server is operational and healthy",
    data: {
      status: "UP",
      timestamp: new Date().toISOString(),
      healthEndpoint: "/api/v1/health",
    },
  });
});

// Fallback for unmatched routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Requested API endpoint not found",
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
