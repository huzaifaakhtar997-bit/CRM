import { Company, Contact, ActivityType } from "@prisma/client";
import { companyRepository, CompanyRepository, CompanyListResult } from "../repositories/company.repository";
import { prisma } from "../config/database";
import { CreateCompanyInput, UpdateCompanyInput, QueryCompanyInput } from "../validators/company.validator";
import { AppError } from "../types/auth.types";

export class CompanyService {
  constructor(private companyRepo: CompanyRepository) {}

  async createCompany(input: CreateCompanyInput, currentUserId: string): Promise<Company> {
    const existing = await this.companyRepo.findByName(input.name);
    if (existing) {
      throw new AppError(`A company with the name '${input.name}' already exists.`, 400);
    }

    // Execute Company creation and Activity log inside Prisma transaction
    const company = await prisma.$transaction(async (tx) => {
      const newCompany = await tx.company.create({
        data: {
          name: input.name,
          website: input.website,
          industry: input.industry,
          size: input.size,
          phone: input.phone,
          email: input.email ? input.email.toLowerCase() : null,
          address: input.address,
          logoUrl: input.logoUrl,
          annualRevenue: input.annualRevenue,
          description: input.description,
        },
      });

      // Automatically create Activity log record
      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Company Created",
          content: `Created company ${newCompany.name}${newCompany.industry ? ` (${newCompany.industry})` : ""}`,
          userId: currentUserId,
          metadata: {
            companyId: newCompany.id,
            companyName: newCompany.name,
            industry: newCompany.industry,
          },
        },
      });

      return newCompany;
    });

    return company;
  }

  async getCompanies(query: QueryCompanyInput): Promise<CompanyListResult> {
    return this.companyRepo.findAll(query);
  }

  async getCompanyById(id: string): Promise<Company> {
    const company = await this.companyRepo.findById(id);
    if (!company) {
      throw new AppError(`Company with ID '${id}' not found.`, 404);
    }
    return company;
  }

  async getCompanyContacts(companyId: string): Promise<Contact[]> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new AppError(`Company with ID '${companyId}' not found.`, 404);
    }
    return this.companyRepo.findCompanyContacts(companyId);
  }

  async updateCompany(id: string, input: UpdateCompanyInput, currentUserId: string): Promise<Company> {
    const existing = await this.companyRepo.findById(id);
    if (!existing) {
      throw new AppError(`Company with ID '${id}' not found.`, 404);
    }

    if (input.name && input.name.toLowerCase() !== existing.name.toLowerCase()) {
      const nameConflict = await this.companyRepo.findByName(input.name);
      if (nameConflict) {
        throw new AppError(`A company with the name '${input.name}' already exists.`, 400);
      }
    }

    const updatedCompany = await prisma.$transaction(async (tx) => {
      const updated = await tx.company.update({
        where: { id },
        data: {
          ...input,
          email: input.email !== undefined ? (input.email ? input.email.toLowerCase() : null) : undefined,
        },
      });

      // Automatically create Activity log record for update
      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Company Updated",
          content: `Updated profile details for company ${updated.name}`,
          userId: currentUserId,
          metadata: {
            companyId: updated.id,
            companyName: updated.name,
            updatedFields: Object.keys(input),
          },
        },
      });

      return updated;
    });

    return updatedCompany;
  }

  async deleteCompany(id: string): Promise<{ id: string }> {
    const existing = await this.companyRepo.findById(id);
    if (!existing) {
      throw new AppError(`Company with ID '${id}' not found.`, 404);
    }

    await this.companyRepo.delete(id);
    return { id };
  }
}

export const companyService = new CompanyService(companyRepository);
