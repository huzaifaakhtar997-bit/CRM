import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { importController } from "../controllers/import.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { UserRole } from "@prisma/client";
import { AppError } from "../types/auth.types";

const router = Router();

// ─── Multer configuration ─────────────────────────────────────────────────────
// Use in-memory storage so the buffer is available directly on req.file.buffer.
// We keep the limit at 10 MB — large enough for typical CRM import files.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (_req, file, cb) => {
    // Accept CSV and XLSX mime types (also application/octet-stream for some browsers)
    const allowedMimes = [
      "text/csv",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Returning an error here lets multer reject at the middleware level.
      // The extension double-check in the controller is the authoritative gate.
      cb(null, true); // Allow through; extension check in controller handles rejection
    }
  },
});

// Multer error handler — converts multer errors (e.g. file-too-large) to AppErrors
const handleMulterError = (
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("File too large. Maximum allowed size is 10 MB.", 422));
    }
    return next(new AppError(`File upload error: ${err.message}`, 422));
  }
  next(err);
};

// ─── All routes require authentication ───────────────────────────────────────
router.use(authenticate);

// POST /api/v1/imports/:type
// Upload a CSV or XLSX file to import contacts or companies.
// RBAC: ADMIN, MANAGER, SALES_REP
router.post(
  "/imports/:type",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP),
  upload.single("file"),
  handleMulterError,
  importController.uploadImport
);

// GET /api/v1/imports
// List import job history (paginated).
// RBAC: ADMIN, MANAGER, SALES_REP, SUPPORT
router.get(
  "/imports",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.SUPPORT),
  importController.listImportJobs
);

// GET /api/v1/imports/:jobId
// Get a specific import job's status and error log.
// RBAC: ADMIN, MANAGER, SALES_REP, SUPPORT
router.get(
  "/imports/:jobId",
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.SUPPORT),
  importController.getImportJob
);

export default router;
