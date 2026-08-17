import { ImportJob, ImportJobStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export interface ImportJobCreateData {
  fileName: string;
  importType: string;
  createdById: string;
}

export interface ImportJobUpdateData {
  status?: ImportJobStatus;
  totalRecords?: number;
  successfulRecords?: number;
  failedRecords?: number;
  skippedRecords?: number;
  errorLog?: Prisma.InputJsonValue;
  completedAt?: Date;
}

export interface ImportJobListResult {
  jobs: ImportJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ImportRepository {
  /**
   * Create a new ImportJob record in PROCESSING state.
   */
  async createImportJob(data: ImportJobCreateData): Promise<ImportJob> {
    return prisma.importJob.create({
      data: {
        fileName: data.fileName,
        importType: data.importType,
        status: ImportJobStatus.PROCESSING,
        createdById: data.createdById,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Update an existing ImportJob — used to set final counts, status,
   * error log, and completedAt timestamp.
   */
  async updateImportJob(id: string, data: ImportJobUpdateData): Promise<ImportJob> {
    return prisma.importJob.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.totalRecords !== undefined && { totalRecords: data.totalRecords }),
        ...(data.successfulRecords !== undefined && { successfulRecords: data.successfulRecords }),
        ...(data.failedRecords !== undefined && { failedRecords: data.failedRecords }),
        ...(data.skippedRecords !== undefined && { skippedRecords: data.skippedRecords }),
        ...(data.errorLog !== undefined && { errorLog: data.errorLog }),
        ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Get a single ImportJob by ID.
   */
  async findById(id: string): Promise<ImportJob | null> {
    return prisma.importJob.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Get paginated import history for a specific user (or all jobs for ADMIN).
   */
  async findMany(options: {
    createdById?: string; // If omitted, returns all (ADMIN view)
    page: number;
    limit: number;
  }): Promise<ImportJobListResult> {
    const { createdById, page, limit } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ImportJobWhereInput = {};
    if (createdById) {
      where.createdById = createdById;
    }

    const [jobs, total] = await Promise.all([
      prisma.importJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.importJob.count({ where }),
    ]);

    return {
      jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const importRepository = new ImportRepository();
