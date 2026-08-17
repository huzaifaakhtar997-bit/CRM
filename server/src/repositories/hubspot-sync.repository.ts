import { Contact, Company, Deal, PipelineStage, IntegrationConnection, IntegrationProvider, SyncLog, SyncLogStatus, IntegrationFieldMapping, IntegrationStageMapping } from "@prisma/client";
import { prisma } from "../config/database";

export class HubspotSyncRepository {
  async findActiveConnection(): Promise<IntegrationConnection | null> {
    return prisma.integrationConnection.findUnique({
      where: { provider: IntegrationProvider.HUBSPOT },
    });
  }

  async findContactByHubspotId(hubspotId: string): Promise<Contact | null> {
    return prisma.contact.findUnique({
      where: { hubspotId },
    });
  }

  async findContactByEmail(email: string): Promise<Contact | null> {
    return prisma.contact.findUnique({
      where: { email },
    });
  }

  async findAllContacts(): Promise<Contact[]> {
    return prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findCompanyByHubspotId(hubspotId: string): Promise<Company | null> {
    return prisma.company.findUnique({
      where: { hubspotId },
    });
  }

  async findCompanyByName(name: string): Promise<Company | null> {
    // Exact match for name
    return prisma.company.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
  }

  async findCompanyByWebsite(website: string): Promise<Company | null> {
    return prisma.company.findFirst({
      where: { website: { equals: website, mode: "insensitive" } },
    });
  }

  async findAllCompanies(): Promise<Company[]> {
    return prisma.company.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findDealByHubspotId(hubspotId: string): Promise<Deal | null> {
    return prisma.deal.findUnique({
      where: { hubspotId },
    });
  }

  async findAllDeals(): Promise<Deal[]> {
    return prisma.deal.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findFirstPipelineStage(): Promise<PipelineStage | null> {
    return prisma.pipelineStage.findFirst({
      where: { isLost: false },
      orderBy: { order: "asc" },
    });
  }

  async createSyncLog(integrationId: string, entityType: string, entityId: string | null, status: SyncLogStatus, message: string): Promise<SyncLog> {
    return prisma.syncLog.create({
      data: {
        integrationId,
        entityType,
        entityId,
        status,
        message,
      },
    });
  }

  async getLatestSyncLog(integrationId: string): Promise<SyncLog | null> {
    return prisma.syncLog.findFirst({
      where: { integrationId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAPPING METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  async getFieldMappings(): Promise<IntegrationFieldMapping[]> {
    return prisma.integrationFieldMapping.findMany({
      where: { isActive: true },
    });
  }

  async getStageMappings(): Promise<IntegrationStageMapping[]> {
    return prisma.integrationStageMapping.findMany({
      where: { isActive: true },
    });
  }

  async saveFieldMapping(entityType: string, crmField: string, hubspotProperty: string): Promise<IntegrationFieldMapping> {
    return prisma.integrationFieldMapping.upsert({
      where: {
        entityType_crmField: { entityType, crmField },
      },
      update: {
        hubspotProperty,
        isActive: true,
      },
      create: {
        entityType,
        crmField,
        hubspotProperty,
        isActive: true,
      },
    });
  }

  async saveStageMapping(pipelineStageName: string, hubspotStage: string): Promise<IntegrationStageMapping> {
    // Stage mapping upsert based on unique constraint
    return prisma.integrationStageMapping.upsert({
      where: { pipelineStageName },
      update: {
        hubspotStage,
        isActive: true,
      },
      create: {
        pipelineStageName,
        hubspotStage,
        isActive: true,
      },
    });
  }

  async clearMappings(): Promise<void> {
    await prisma.integrationFieldMapping.deleteMany({});
    await prisma.integrationStageMapping.deleteMany({});
  }
}

export const hubspotSyncRepository = new HubspotSyncRepository();

