import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";
// Needs to parse raw body for Svix webhook verification. 
// express.raw() is the best way to get the exact bytes.
import express from "express";

const router = Router();
const webhookController = new WebhookController();

// Use express.raw() to get the unparsed body as a Buffer, then convert to string.
// Svix requires the exact raw string body.
router.post(
  "/resend",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    // If body is a buffer (from express.raw), assign it to rawBody string
    if (Buffer.isBuffer(req.body)) {
      (req as any).rawBody = req.body.toString("utf8");
    }
    next();
  },
  webhookController.handleResendWebhook.bind(webhookController)
);

export default router;
