/**
 * import.service.ts
 *
 * Orchestrates the full import pipeline:
 *  1. Create ImportJob (PROCESSING)
 *  2. Parse file buffer via import-parser.service
 *  3. Process valid rows: upsert Contact / Company in PostgreSQL
 *  4. Collect per-row errors without aborting the whole import
 *  5. Update ImportJob with final counts and status
 *
 * Design decisions:
 *  - Each row is imported in its own try/catch to isolate failures.
 *  - We do NOT wrap the whole import in one large transaction — that would
 *    risk aborting 1000s of good rows because of one DB error.
 *  - Contacts: deduplicated by email (when provided) or treated as new.
 *  - Companies: deduplicated by website (when provided), otherwise by name.
 */

import { ImportJob, ImportJobStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { importRepository, ImportRepository } from "../repositories/import.repository";
import {
  parseContactFile,
  parseCompanyFile,
  RowError,
} from "./import-parser.service";
import { AppError } from "../types/auth.types";
import { notificationService } from "./notification.service";

// ─── Result type returned to the controller ───────────────────────────────────

export interface ImportSummary {
  importJob: ImportJob;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  errors: RowError[];
}

// ─── Service class ────────────────────────────────────────────────────────────

export class ImportService {
  constructor(private importRepo: ImportRepository) {}

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: startContactImport
  // ──────────────────────────────────────────────────────────────────────────

  async startContactImport(
    buffer: Buffer,
    fileName: string,
    extension: string,
    userId: string
  ): Promise<ImportSummary> {
    // 1. Create the ImportJob record immediately
    const job = await this.importRepo.createImportJob({
      fileName,
      importType: "contacts",
      createdById: userId,
    });

    // 2. Parse the file
    const parseResult = parseContactFile(buffer, extension);

    // 3. Process valid rows
    let successfulRows = 0;
    let skippedRows = 0;
    const rowErrors: RowError[] = [...parseResult.errors];

    for (const { rowIndex, data } of parseResult.valid) {
      try {
        if (data.email) {
          // ── Duplicate check by email ──────────────────────────────────────
          const existing = await prisma.contact.findUnique({
            where: { email: data.email },
          });

          if (existing) {
            // Update the existing contact with any new/changed values
            await prisma.contact.update({
              where: { id: existing.id },
              data: {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone ?? existing.phone ?? undefined,
                jobTitle: data.jobTitle ?? existing.jobTitle ?? undefined,
              },
            });
            skippedRows++; // Counted as "skipped" (updated in place, not a new record)
            continue;
          }
        }

        // ── Create new contact ──────────────────────────────────────────────
        await prisma.contact.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email ?? null,
            phone: data.phone ?? null,
            jobTitle: data.jobTitle ?? null,
            assignedUserId: userId,
          },
        });

        successfulRows++;
      } catch (err: unknown) {
        // Row-level error — record it and continue
        rowErrors.push({
          row: rowIndex,
          message:
            err instanceof Error
              ? err.message
              : "Unknown database error for this row.",
        });
      }
    }

    // 4. Determine final status
    const failedRows = rowErrors.length - parseResult.errors.length + parseResult.errors.length;
    // failedRows = parse errors + DB errors
    const dbErrors = rowErrors.length - parseResult.errors.length;
    const totalFailed = parseResult.errors.length + (dbErrors > 0 ? dbErrors : 0);

    const finalStatus =
      successfulRows > 0 || skippedRows > 0
        ? ImportJobStatus.COMPLETED
        : ImportJobStatus.FAILED;

    // 5. Update the ImportJob
    const updatedJob = await this.importRepo.updateImportJob(job.id, {
      status: finalStatus,
      totalRecords: parseResult.totalRows,
      successfulRecords: successfulRows,
      failedRecords: rowErrors.filter((e) => e.row > 0).length,
      skippedRecords: skippedRows,
      errorLog: rowErrors.length > 0 ? (rowErrors as unknown as Prisma.InputJsonValue) : undefined,
      completedAt: new Date(),
    });

    const contactSummary = {
      importJob: updatedJob,
      totalRows: parseResult.totalRows,
      successfulRows,
      failedRows: rowErrors.filter((e) => e.row > 0).length,
      skippedRows,
      errors: rowErrors,
    };

    await notificationService.createNotification({
      userId,
      title: finalStatus === "COMPLETED" ? "Contacts Import Completed" : "Contacts Import Failed",
      message: `Import processed ${parseResult.totalRows} rows (${successfulRows} successful, ${skippedRows} skipped, ${contactSummary.failedRows} failed).`,
      type: "import",
    });

    return contactSummary;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: startCompanyImport
  // ──────────────────────────────────────────────────────────────────────────

  async startCompanyImport(
    buffer: Buffer,
    fileName: string,
    extension: string,
    userId: string
  ): Promise<ImportSummary> {
    // 1. Create ImportJob
    const job = await this.importRepo.createImportJob({
      fileName,
      importType: "companies",
      createdById: userId,
    });

    // 2. Parse the file
    const parseResult = parseCompanyFile(buffer, extension);

    // 3. Process valid rows
    let successfulRows = 0;
    let skippedRows = 0;
    const rowErrors: RowError[] = [...parseResult.errors];

    for (const { rowIndex, data } of parseResult.valid) {
      try {
        // ── Duplicate check: website first, then name ─────────────────────
        let existing = null;

        if (data.website) {
          existing = await prisma.company.findFirst({
            where: { website: data.website },
          });
        }

        if (!existing) {
          // Normalised name match (case-insensitive)
          existing = await prisma.company.findFirst({
            where: {
              name: { equals: data.name, mode: "insensitive" },
            },
          });
        }

        if (existing) {
          // Update existing company with imported data
          await prisma.company.update({
            where: { id: existing.id },
            data: {
              website: data.website ?? existing.website ?? undefined,
              industry: data.industry ?? existing.industry ?? undefined,
              phone: data.phone ?? existing.phone ?? undefined,
              email: data.email ?? existing.email ?? undefined,
              address: data.address ?? existing.address ?? undefined,
              size: data.size ?? existing.size ?? undefined,
              annualRevenue: data.annualRevenue ?? existing.annualRevenue ?? undefined,
              description: data.description ?? existing.description ?? undefined,
            },
          });
          skippedRows++;
          continue;
        }

        // ── Create new company ────────────────────────────────────────────
        await prisma.company.create({
          data: {
            name: data.name,
            website: data.website ?? null,
            industry: data.industry ?? null,
            phone: data.phone ?? null,
            email: data.email ?? null,
            address: data.address ?? null,
            size: data.size ?? null,
            annualRevenue: data.annualRevenue ?? null,
            description: data.description ?? null,
          },
        });

        successfulRows++;
      } catch (err: unknown) {
        rowErrors.push({
          row: rowIndex,
          message:
            err instanceof Error
              ? err.message
              : "Unknown database error for this row.",
        });
      }
    }

    // 4. Final status
    const finalStatus =
      successfulRows > 0 || skippedRows > 0
        ? ImportJobStatus.COMPLETED
        : ImportJobStatus.FAILED;

    // 5. Update ImportJob
    const updatedJob = await this.importRepo.updateImportJob(job.id, {
      status: finalStatus,
      totalRecords: parseResult.totalRows,
      successfulRecords: successfulRows,
      failedRecords: rowErrors.filter((e) => e.row > 0).length,
      skippedRecords: skippedRows,
      errorLog: rowErrors.length > 0 ? (rowErrors as unknown as Prisma.InputJsonValue) : undefined,
      completedAt: new Date(),
    });

    const summary = {
      importJob: updatedJob,
      totalRows: parseResult.totalRows,
      successfulRows,
      failedRows: rowErrors.filter((e) => e.row > 0).length,
      skippedRows,
      errors: rowErrors,
    };

    await notificationService.createNotification({
      userId,
      title: finalStatus === "COMPLETED" ? "Companies Import Completed" : "Companies Import Failed",
      message: `Import processed ${parseResult.totalRows} rows (${successfulRows} successful, ${skippedRows} skipped, ${summary.failedRows} failed).`,
      type: "import",
    });

    return summary;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: getImportStatus
  // ──────────────────────────────────────────────────────────────────────────

  async getImportStatus(jobId: string): Promise<ImportJob> {
    const job = await this.importRepo.findById(jobId);
    if (!job) {
      throw new AppError(`Import job with ID '${jobId}' not found.`, 404);
    }
    return job;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: listImportJobs
  // ──────────────────────────────────────────────────────────────────────────

  async listImportJobs(options: {
    userId: string;
    role: string;
    page: number;
    limit: number;
  }) {
    // ADMIN/MANAGER can see all jobs; others see only their own
    const isElevated = options.role === "ADMIN" || options.role === "MANAGER";
    return this.importRepo.findMany({
      createdById: isElevated ? undefined : options.userId,
      page: options.page,
      limit: options.limit,
    });
  }
}

export const importService = new ImportService(importRepository);
