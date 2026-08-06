import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import contactRoutes from "./contact.routes";
import companyRoutes from "./company.routes";
import leadRoutes from "./lead.routes";
import dealRoutes from "./deal.routes";
import pipelineRoutes from "./pipeline.routes";
import taskRoutes from "./task.routes";
import conversationRoutes from "./conversation.routes";
import messageRoutes from "./message.routes";
import replyRoutes from "./reply.routes";
import noteRoutes from "./note.routes";
import templateRoutes from "./template.routes";
import replyTemplateRoutes from "./reply-template.routes";
import conversationContactRoutes from "./conversation-contact.routes";
import campaignRoutes from "./campaign.routes";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "CRM API server is operational and healthy",
    data: {
      status: "UP",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/contacts", contactRoutes);
router.use("/companies", companyRoutes);
router.use("/leads", leadRoutes);
router.use("/deals", dealRoutes);
router.use("/pipeline", pipelineRoutes);
router.use("/tasks", taskRoutes);
router.use("/conversations", conversationRoutes);
router.use("/templates", templateRoutes);
router.use("/", messageRoutes); // Mapped at root since endpoints contain nested shapes /conversations/:id/messages and /messages/:id
router.use("/", replyRoutes); // Mapped at root to capture nested POST /conversations/:id/reply shape
router.use("/", noteRoutes); // Mapped at root to capture nested POST /conversations/:id/notes shape
router.use("/", replyTemplateRoutes); // Mapped at root to capture nested POST /conversations/:id/reply/template shape
router.use("/", conversationContactRoutes); // Mapped at root to capture nested PATCH/POST /conversations/:id/contact shapes
router.use("/campaigns", campaignRoutes);

export default router;
