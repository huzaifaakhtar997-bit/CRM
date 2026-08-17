import { Contact, ActivityType, SyncLogStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { hubspotSyncRepository, HubspotSyncRepository } from "../repositories/hubspot-sync.repository";
import { hubspotClient } from "./hubspot-client.service";
import { AppError } from "../types/auth.types";
import { decryptToken } from "../utils/encryption";
import { notificationService } from "./notification.service";

export interface SyncSummary {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

export interface SyncStatusDetails {
  provider: string;
  status: string;
  lastSyncAt: Date | null;
  latestLog: {
    status: SyncLogStatus;
    message: string | null;
    createdAt: Date;
  } | null;
}

export class HubspotSyncService {
  constructor(private syncRepo: HubspotSyncRepository) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // MAPPING CONFIGURATION & TRANSLATION LAYER
  // ─────────────────────────────────────────────────────────────────────────────

  async getMappings() {
    const fields = await this.syncRepo.getFieldMappings();
    const stages = await this.syncRepo.getStageMappings();
    return {
      fieldMappings: fields.map(f => ({
        entityType: f.entityType,
        crmField: f.crmField,
        hubspotProperty: f.hubspotProperty,
      })),
      stageMappings: stages.map(s => ({
        pipelineStageName: s.pipelineStageName,
        hubspotStage: s.hubspotStage,
      })),
    };
  }

  async updateMappings(payload: {
    fieldMappings: Array<{ entityType: string; crmField: string; hubspotProperty: string }>;
    stageMappings: Array<{ pipelineStageName: string; hubspotStage: string }>;
  }) {
    await this.syncRepo.clearMappings();
    for (const fm of payload.fieldMappings) {
      await this.syncRepo.saveFieldMapping(fm.entityType, fm.crmField, fm.hubspotProperty);
    }
    for (const sm of payload.stageMappings) {
      await this.syncRepo.saveStageMapping(sm.pipelineStageName, sm.hubspotStage);
    }
    return this.getMappings();
  }

  private async getMapper(entityType: "contact" | "company" | "deal") {
    const dbMappings = await this.syncRepo.getFieldMappings();
    const entityMappings = dbMappings.filter(m => m.entityType === entityType);

    const defaultFields: Record<string, any> = {
      contact: {
        firstName: "firstname",
        lastName: "lastname",
        email: "email",
        phone: "phone",
        jobTitle: "jobtitle",
      },
      company: {
        name: "name",
        industry: "industry",
        website: "website",
        phone: "phone",
        annualRevenue: "annualrevenue",
        description: "description",
      },
      deal: {
        title: "dealname",
        value: "amount",
        expectedCloseDate: "closedate",
      },
    }[entityType];

    const crmToHs: Record<string, string> = { ...defaultFields };
    entityMappings.forEach(m => {
      crmToHs[m.crmField] = m.hubspotProperty;
    });

    const hsToCrm: Record<string, string> = {};
    Object.entries(crmToHs).forEach(([crmF, hsP]) => {
      hsToCrm[hsP] = crmF;
    });

    return { crmToHs, hsToCrm };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTACT SYNC
  // ─────────────────────────────────────────────────────────────────────────────

  async importContacts(currentUserId: string): Promise<SyncSummary> {
    const connection = await this.syncRepo.findActiveConnection();
    if (!connection || connection.status !== "CONNECTED" || !connection.accessToken) {
      throw new AppError("HubSpot integration is not connected. Setup connection first.", 404);
    }
    const token = decryptToken(connection.accessToken);

    const summary: SyncSummary = { created: 0, updated: 0, skipped: 0, failed: 0 };
    let hsContacts;
    try {
      hsContacts = await hubspotClient.getContacts(token);
    } catch (e: any) {
      await this.syncRepo.createSyncLog(
        connection.id,
        "contact",
        null,
        SyncLogStatus.FAILED,
        `Import failed during HubSpot API call: ${e.message}`
      );
      throw e;
    }

    const { hsToCrm } = await this.getMapper("contact");

    for (const hsContact of hsContacts) {
      try {
        const props = hsContact.properties as any;
        const mappedData: any = {};
        
        Object.entries(hsToCrm).forEach(([hsP, crmF]) => {
          if (props[hsP] !== undefined) {
            mappedData[crmF] = props[hsP];
          }
        });

        const email = mappedData.email;
        let matchedContact = await this.syncRepo.findContactByHubspotId(hsContact.id);
        if (!matchedContact && email) {
          matchedContact = await this.syncRepo.findContactByEmail(email);
        }

        if (matchedContact) {
          await prisma.contact.update({
            where: { id: matchedContact.id },
            data: {
              firstName: mappedData.firstName || matchedContact.firstName,
              lastName: mappedData.lastName || matchedContact.lastName,
              phone: mappedData.phone || matchedContact.phone,
              jobTitle: mappedData.jobTitle || matchedContact.jobTitle,
              hubspotId: hsContact.id,
            },
          });
          summary.updated++;
        } else {
          await prisma.contact.create({
            data: {
              firstName: mappedData.firstName || "HubSpot",
              lastName: mappedData.lastName || "Import",
              email: email || null,
              phone: mappedData.phone || null,
              jobTitle: mappedData.jobTitle || null,
              hubspotId: hsContact.id,
              lifecycleStage: "LEAD",
            },
          });
          summary.created++;
        }
      } catch (err) {
        summary.failed++;
      }
    }

    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    const successMsg = `Import completed. Created: ${summary.created}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`;
    await this.syncRepo.createSyncLog(
      connection.id,
      "contact",
      null,
      summary.failed > 0 && summary.created === 0 && summary.updated === 0
        ? SyncLogStatus.FAILED
        : SyncLogStatus.SUCCESS,
      successMsg
    );

    await prisma.activity.create({
      data: {
        type: ActivityType.NOTE,
        title: "HubSpot Contacts Imported",
        content: `Imported contacts from HubSpot successfully. Details: ${successMsg}`,
        userId: currentUserId,
      },
    });

    return summary;
  }

  async exportContacts(currentUserId: string): Promise<SyncSummary> {
    const connection = await this.syncRepo.findActiveConnection();
    if (!connection || connection.status !== "CONNECTED" || !connection.accessToken) {
      throw new AppError("HubSpot integration is not connected. Setup connection first.", 404);
    }
    const token = decryptToken(connection.accessToken);

    const summary: SyncSummary = { created: 0, updated: 0, skipped: 0, failed: 0 };
    const localContacts = await this.syncRepo.findAllContacts();
    const { crmToHs } = await this.getMapper("contact");

    for (const contact of localContacts) {
      try {
        if (!contact.email) {
          summary.skipped++;
          continue;
        }

        const payload: any = {};
        Object.entries(crmToHs).forEach(([crmF, hsP]) => {
          const val = (contact as any)[crmF];
          if (val !== undefined && val !== null) {
            payload[hsP] = val;
          }
        });

        payload.email = contact.email;

        if (contact.hubspotId) {
          await hubspotClient.updateContact(token, contact.hubspotId, payload);
          summary.updated++;
        } else {
          const hsContact = await hubspotClient.createContact(token, payload);
          await prisma.contact.update({
            where: { id: contact.id },
            data: { hubspotId: hsContact.id },
          });
          summary.created++;
        }
      } catch (err) {
        summary.failed++;
      }
    }

    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    const successMsg = `Export completed. Created: ${summary.created}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`;
    await this.syncRepo.createSyncLog(
      connection.id,
      "contact",
      null,
      summary.failed > 0 && summary.created === 0 && summary.updated === 0
        ? SyncLogStatus.FAILED
        : SyncLogStatus.SUCCESS,
      successMsg
    );

    await prisma.activity.create({
      data: {
        type: ActivityType.NOTE,
        title: "HubSpot Contacts Exported",
        content: `Exported contacts to HubSpot successfully. Details: ${successMsg}`,
        userId: currentUserId,
      },
    });

    return summary;
  }

  async syncContacts(currentUserId: string): Promise<SyncSummary> {
    const importSummary = await this.importContacts(currentUserId);
    const exportSummary = await this.exportContacts(currentUserId);

    const summary: SyncSummary = {
      created: importSummary.created + exportSummary.created,
      updated: importSummary.updated + exportSummary.updated,
      skipped: importSummary.skipped + exportSummary.skipped,
      failed: importSummary.failed + exportSummary.failed,
    };

    const connection = await this.syncRepo.findActiveConnection();
    if (connection) {
      const syncMsg = `Bidirectional sync completed. Created: ${summary.created}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`;
      await this.syncRepo.createSyncLog(
        connection.id,
        "contact",
        null,
        summary.failed > 0 && summary.created === 0 && summary.updated === 0
          ? SyncLogStatus.FAILED
          : SyncLogStatus.SUCCESS,
        syncMsg
      );

      await prisma.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "HubSpot Contacts Synced",
          content: `Bidirectional HubSpot contact sync completed. Details: ${syncMsg}`,
          userId: currentUserId,
        },
      });

      await notificationService.createNotification({
        userId: currentUserId,
        title: summary.failed > 0 && summary.created === 0 && summary.updated === 0 ? "HubSpot Contacts Sync Failed" : "HubSpot Contacts Sync Completed",
        message: `Bidirectional sync completed. Created: ${summary.created}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`,
        type: "hubspot",
      });
    }

    return summary;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPANY SYNC
  // ─────────────────────────────────────────────────────────────────────────────

  async importCompanies(currentUserId: string): Promise<SyncSummary> {
    const connection = await this.syncRepo.findActiveConnection();
    if (!connection || connection.status !== "CONNECTED" || !connection.accessToken) {
      throw new AppError("HubSpot integration is not connected. Setup connection first.", 404);
    }
    const token = decryptToken(connection.accessToken);

    const summary: SyncSummary = { created: 0, updated: 0, skipped: 0, failed: 0 };
    let hsCompanies;
    try {
      hsCompanies = await hubspotClient.getCompanies(token);
    } catch (e: any) {
      await this.syncRepo.createSyncLog(
        connection.id,
        "company",
        null,
        SyncLogStatus.FAILED,
        `Import failed during HubSpot API call: ${e.message}`
      );
      throw e;
    }

    const { hsToCrm } = await this.getMapper("company");

    for (const hsCompany of hsCompanies) {
      try {
        const props = hsCompany.properties as any;
        const mappedData: any = {};

        Object.entries(hsToCrm).forEach(([hsP, crmF]) => {
          if (props[hsP] !== undefined) {
            if (crmF === "annualRevenue") {
              mappedData[crmF] = props[hsP] ? parseFloat(props[hsP]) : null;
            } else {
              mappedData[crmF] = props[hsP];
            }
          }
        });

        const name = mappedData.name;
        const website = mappedData.website;

        if (!name) {
          summary.skipped++;
          continue;
        }

        let matchedCompany = await this.syncRepo.findCompanyByHubspotId(hsCompany.id);
        if (!matchedCompany && name) {
          matchedCompany = await this.syncRepo.findCompanyByName(name);
        }
        if (!matchedCompany && website) {
          matchedCompany = await this.syncRepo.findCompanyByWebsite(website);
        }

        if (matchedCompany) {
          await prisma.company.update({
            where: { id: matchedCompany.id },
            data: {
              name: name || matchedCompany.name,
              website: website || matchedCompany.website,
              industry: mappedData.industry || matchedCompany.industry,
              phone: mappedData.phone || matchedCompany.phone,
              annualRevenue: mappedData.annualRevenue !== undefined ? mappedData.annualRevenue : matchedCompany.annualRevenue,
              description: mappedData.description || matchedCompany.description,
              hubspotId: hsCompany.id,
            },
          });
          summary.updated++;
        } else {
          await prisma.company.create({
            data: {
              name: name || "HubSpot Company",
              website: website || null,
              industry: mappedData.industry || null,
              phone: mappedData.phone || null,
              annualRevenue: mappedData.annualRevenue || null,
              description: mappedData.description || null,
              hubspotId: hsCompany.id,
            },
          });
          summary.created++;
        }
      } catch (err) {
        summary.failed++;
      }
    }

    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    const successMsg = `Import completed. Created: ${summary.created}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`;
    await this.syncRepo.createSyncLog(
      connection.id,
      "company",
      null,
      summary.failed > 0 && summary.created === 0 && summary.updated === 0
        ? SyncLogStatus.FAILED
        : SyncLogStatus.SUCCESS,
      successMsg
    );

    await prisma.activity.create({
      data: {
        type: ActivityType.NOTE,
        title: "HubSpot Companies Imported",
        content: `Imported companies from HubSpot successfully. Details: ${successMsg}`,
        userId: currentUserId,
      },
    });

    return summary;
  }

  async exportCompanies(currentUserId: string): Promise<SyncSummary> {
    const connection = await this.syncRepo.findActiveConnection();
    if (!connection || connection.status !== "CONNECTED" || !connection.accessToken) {
      throw new AppError("HubSpot integration is not connected. Setup connection first.", 404);
    }
    const token = decryptToken(connection.accessToken);

    const summary: SyncSummary = { created: 0, updated: 0, skipped: 0, failed: 0 };
    const localCompanies = await this.syncRepo.findAllCompanies();
    const { crmToHs } = await this.getMapper("company");

    for (const company of localCompanies) {
      try {
        if (!company.name) {
          summary.skipped++;
          continue;
        }

        const payload: any = {};
        Object.entries(crmToHs).forEach(([crmF, hsP]) => {
          const val = (company as any)[crmF];
          if (val !== undefined && val !== null) {
            payload[hsP] = crmF === "annualRevenue" ? String(val) : val;
          }
        });

        payload.name = company.name;

        if (company.hubspotId) {
          await hubspotClient.updateCompany(token, company.hubspotId, payload);
          summary.updated++;
        } else {
          const hsCompany = await hubspotClient.createCompany(token, payload);
          await prisma.company.update({
            where: { id: company.id },
            data: { hubspotId: hsCompany.id },
          });
          summary.created++;
        }
      } catch (err) {
        summary.failed++;
      }
    }

    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    const successMsg = `Export completed. Created: ${summary.created}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`;
    await this.syncRepo.createSyncLog(
      connection.id,
      "company",
      null,
      summary.failed > 0 && summary.created === 0 && summary.updated === 0
        ? SyncLogStatus.FAILED
        : SyncLogStatus.SUCCESS,
      successMsg
    );

    await prisma.activity.create({
      data: {
        type: ActivityType.NOTE,
        title: "HubSpot Companies Exported",
        content: `Exported companies to HubSpot successfully. Details: ${successMsg}`,
        userId: currentUserId,
      },
    });

    return summary;
  }

  async syncCompanies(currentUserId: string): Promise<SyncSummary> {
    const importSummary = await this.importCompanies(currentUserId);
    const exportSummary = await this.exportCompanies(currentUserId);

    const summary: SyncSummary = {
      created: importSummary.created + exportSummary.created,
      updated: importSummary.updated + exportSummary.updated,
      skipped: importSummary.skipped + exportSummary.skipped,
      failed: importSummary.failed + exportSummary.failed,
    };

    const connection = await this.syncRepo.findActiveConnection();
    if (connection) {
      const syncMsg = `Bidirectional sync completed. Created: ${summary.created}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`;
      await this.syncRepo.createSyncLog(
        connection.id,
        "company",
        null,
        summary.failed > 0 && summary.created === 0 && summary.updated === 0
          ? SyncLogStatus.FAILED
          : SyncLogStatus.SUCCESS,
        syncMsg
      );

      await prisma.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "HubSpot Companies Synced",
          content: `Bidirectional HubSpot company sync completed. Details: ${syncMsg}`,
          userId: currentUserId,
        },
      });

      await notificationService.createNotification({
        userId: currentUserId,
        title: summary.failed > 0 && summary.created === 0 && summary.updated === 0 ? "HubSpot Companies Sync Failed" : "HubSpot Companies Sync Completed",
        message: `Bidirectional sync completed. Created: ${summary.created}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`,
        type: "hubspot",
      });
    }

    return summary;
  }

  async getSyncStatus(): Promise<SyncStatusDetails> {
    const connection = await this.syncRepo.findActiveConnection();
    if (!connection) {
      throw new AppError("HubSpot connection configuration not found.", 404);
    }

    const latestLog = await this.syncRepo.getLatestSyncLog(connection.id);

    return {
      provider: connection.provider,
      status: connection.status,
      lastSyncAt: connection.lastSyncAt,
      latestLog: latestLog
        ? {
            status: latestLog.status,
            message: latestLog.message,
            createdAt: latestLog.createdAt,
          }
        : null,
    };
  }

  async getCompanySyncStatus(): Promise<SyncStatusDetails> {
    const connection = await this.syncRepo.findActiveConnection();
    if (!connection) {
      throw new AppError("HubSpot connection configuration not found.", 404);
    }

    const latestLog = await prisma.syncLog.findFirst({
      where: { integrationId: connection.id, entityType: "company" },
      orderBy: { createdAt: "desc" },
    });

    return {
      provider: connection.provider,
      status: connection.status,
      lastSyncAt: connection.lastSyncAt,
      latestLog: latestLog
        ? {
            status: latestLog.status,
            message: latestLog.message,
            createdAt: latestLog.createdAt,
          }
        : null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DEAL SYNC
  // ─────────────────────────────────────────────────────────────────────────────

  async importDeals(currentUserId: string): Promise<SyncSummary> {
    const connection = await this.syncRepo.findActiveConnection();
    if (!connection || connection.status !== "CONNECTED" || !connection.accessToken) {
      throw new AppError("HubSpot integration is not connected. Setup connection first.", 404);
    }
    const token = decryptToken(connection.accessToken);

    const summary: SyncSummary = { created: 0, updated: 0, skipped: 0, failed: 0 };
    let hsDeals;
    try {
      hsDeals = await hubspotClient.getDeals(token);
    } catch (e: any) {
      await this.syncRepo.createSyncLog(
        connection.id,
        "deal",
        null,
        SyncLogStatus.FAILED,
        `Import failed during HubSpot API call: ${e.message}`
      );
      throw e;
    }

    const { hsToCrm } = await this.getMapper("deal");
    const stageMappings = await this.syncRepo.getStageMappings();

    for (const hsDeal of hsDeals) {
      try {
        const props = hsDeal.properties as any;
        const mappedData: any = {};

        Object.entries(hsToCrm).forEach(([hsP, crmF]) => {
          if (props[hsP] !== undefined) {
            if (crmF === "value") {
              mappedData[crmF] = props[hsP] ? parseFloat(props[hsP]) : 0;
            } else if (crmF === "expectedCloseDate") {
              mappedData[crmF] = props[hsP] ? new Date(props[hsP]) : new Date();
            } else {
              mappedData[crmF] = props[hsP];
            }
          }
        });

        const dealname = mappedData.title;
        if (!dealname) {
          summary.skipped++;
          continue;
        }

        const hsStage = props.dealstage;
        let matchedStageName = "";
        
        if (hsStage) {
          const matchedStageMapping = stageMappings.find(s => s.hubspotStage === hsStage);
          if (matchedStageMapping) {
            matchedStageName = matchedStageMapping.pipelineStageName;
          } else {
            summary.skipped++;
            await this.syncRepo.createSyncLog(
              connection.id,
              "deal",
              null,
              SyncLogStatus.SKIPPED,
              `Skipped importing deal "${dealname}" due to unmapped HubSpot dealstage: "${hsStage}"`
            );
            continue;
          }
        } else {
          summary.skipped++;
          continue;
        }

        const targetStage = await prisma.pipelineStage.findUnique({
          where: { name: matchedStageName },
        });

        if (!targetStage) {
          summary.skipped++;
          await this.syncRepo.createSyncLog(
            connection.id,
            "deal",
            null,
            SyncLogStatus.SKIPPED,
            `Skipped importing deal "${dealname}" because CRM PipelineStage "${matchedStageName}" was not found in database.`
          );
          continue;
        }

        const matchedDeal = await this.syncRepo.findDealByHubspotId(hsDeal.id);

        if (matchedDeal) {
          await prisma.deal.update({
            where: { id: matchedDeal.id },
            data: {
              title: dealname,
              value: mappedData.value !== undefined ? mappedData.value : matchedDeal.value,
              expectedCloseDate: mappedData.expectedCloseDate || matchedDeal.expectedCloseDate,
              stageId: targetStage.id,
              probability: targetStage.probability,
              hubspotId: hsDeal.id,
            },
          });
          summary.updated++;
        } else {
          await prisma.deal.create({
            data: {
              title: dealname,
              value: mappedData.value || 0,
              expectedCloseDate: mappedData.expectedCloseDate || new Date(),
              hubspotId: hsDeal.id,
              stageId: targetStage.id,
              probability: targetStage.probability,
            },
          });
          summary.created++;
        }
      } catch (err) {
        summary.failed++;
      }
    }

    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    const msg = `Deal import completed. Created: ${summary.created}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`;
    await this.syncRepo.createSyncLog(
      connection.id,
      "deal",
      null,
      summary.failed > 0 && summary.created === 0 && summary.updated === 0
        ? SyncLogStatus.FAILED
        : SyncLogStatus.SUCCESS,
      msg
    );

    await prisma.activity.create({
      data: {
        type: ActivityType.NOTE,
        title: "HubSpot Deals Imported",
        content: `Imported deals from HubSpot. ${msg}`,
        userId: currentUserId,
      },
    });

    return summary;
  }

  async exportDeals(currentUserId: string): Promise<SyncSummary> {
    const connection = await this.syncRepo.findActiveConnection();
    if (!connection || connection.status !== "CONNECTED" || !connection.accessToken) {
      throw new AppError("HubSpot integration is not connected. Setup connection first.", 404);
    }
    const token = decryptToken(connection.accessToken);

    const summary: SyncSummary = { created: 0, updated: 0, skipped: 0, failed: 0 };
    const localDeals = await this.syncRepo.findAllDeals();
    const { crmToHs } = await this.getMapper("deal");
    const stageMappings = await this.syncRepo.getStageMappings();

    for (const deal of localDeals) {
      try {
        if (!deal.title) {
          summary.skipped++;
          continue;
        }

        const stage = await prisma.pipelineStage.findUnique({
          where: { id: deal.stageId },
        });

        if (!stage) {
          summary.skipped++;
          continue;
        }

        const matchedStageMapping = stageMappings.find(s => s.pipelineStageName === stage.name);
        if (!matchedStageMapping) {
          summary.skipped++;
          await this.syncRepo.createSyncLog(
            connection.id,
            "deal",
            deal.id,
            SyncLogStatus.SKIPPED,
            `Skipped exporting deal "${deal.title}" because stage "${stage.name}" has no HubSpot dealstage mapping.`
          );
          continue;
        }

        const payload: any = {};
        Object.entries(crmToHs).forEach(([crmF, hsP]) => {
          const val = (deal as any)[crmF];
          if (val !== undefined && val !== null) {
            if (crmF === "value") {
              payload[hsP] = String(val);
            } else if (crmF === "expectedCloseDate") {
              payload[hsP] = val.toISOString();
            } else {
              payload[hsP] = val;
            }
          }
        });

        payload.dealname = deal.title;
        payload.dealstage = matchedStageMapping.hubspotStage;

        if (deal.hubspotId) {
          await hubspotClient.updateDeal(token, deal.hubspotId, payload);
          summary.updated++;
        } else {
          const hsDeal = await hubspotClient.createDeal(token, payload);
          await prisma.deal.update({
            where: { id: deal.id },
            data: { hubspotId: hsDeal.id },
          });
          summary.created++;
        }
      } catch (err) {
        summary.failed++;
      }
    }

    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    const msg = `Deal export completed. Created: ${summary.created}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`;
    await this.syncRepo.createSyncLog(
      connection.id,
      "deal",
      null,
      summary.failed > 0 && summary.created === 0 && summary.updated === 0
        ? SyncLogStatus.FAILED
        : SyncLogStatus.SUCCESS,
      msg
    );

    await prisma.activity.create({
      data: {
        type: ActivityType.NOTE,
        title: "HubSpot Deals Exported",
        content: `Exported deals to HubSpot. ${msg}`,
        userId: currentUserId,
      },
    });

    return summary;
  }

  async syncDeals(currentUserId: string): Promise<SyncSummary> {
    const importSummary = await this.importDeals(currentUserId);
    const exportSummary = await this.exportDeals(currentUserId);

    const summary: SyncSummary = {
      created: importSummary.created + exportSummary.created,
      updated: importSummary.updated + exportSummary.updated,
      skipped: importSummary.skipped + exportSummary.skipped,
      failed: importSummary.failed + exportSummary.failed,
    };

    const connection = await this.syncRepo.findActiveConnection();
    if (connection) {
      const msg = `Bidirectional deal sync completed. Created: ${summary.created}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`;
      await this.syncRepo.createSyncLog(
        connection.id,
        "deal",
        null,
        summary.failed > 0 && summary.created === 0 && summary.updated === 0
          ? SyncLogStatus.FAILED
          : SyncLogStatus.SUCCESS,
        msg
      );

      await prisma.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "HubSpot Deals Synced",
          content: `Bidirectional HubSpot deal sync completed. ${msg}`,
          userId: currentUserId,
        },
      });

      await notificationService.createNotification({
        userId: currentUserId,
        title: summary.failed > 0 && summary.created === 0 && summary.updated === 0 ? "HubSpot Deals Sync Failed" : "HubSpot Deals Sync Completed",
        message: `Bidirectional sync completed. Created: ${summary.created}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Failed: ${summary.failed}`,
        type: "hubspot",
      });
    }

    return summary;
  }

  async getDealSyncStatus(): Promise<SyncStatusDetails> {
    const connection = await this.syncRepo.findActiveConnection();
    if (!connection) {
      throw new AppError("HubSpot connection configuration not found.", 404);
    }

    const latestLog = await prisma.syncLog.findFirst({
      where: { integrationId: connection.id, entityType: "deal" },
      orderBy: { createdAt: "desc" },
    });

    return {
      provider: connection.provider,
      status: connection.status,
      lastSyncAt: connection.lastSyncAt,
      latestLog: latestLog
        ? {
            status: latestLog.status,
            message: latestLog.message,
            createdAt: latestLog.createdAt,
          }
        : null,
    };
  }
}

export const hubspotSyncService = new HubspotSyncService(hubspotSyncRepository);
