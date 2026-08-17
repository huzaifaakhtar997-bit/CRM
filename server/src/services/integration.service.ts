import { IntegrationConnection, IntegrationProvider, ActivityType } from "@prisma/client";
import { prisma } from "../config/database";
import { integrationRepository, IntegrationRepository } from "../repositories/integration.repository";
import { AppError } from "../types/auth.types";

import { encryptToken } from "../utils/encryption";
import { hubspotClient } from "./hubspot-client.service";

export interface SafeIntegrationMeta {
  id: string;
  provider: IntegrationProvider;
  status: string;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class IntegrationService {
  constructor(private integrationRepo: IntegrationRepository) {}

  async connectHubspot(accessToken: string, currentUserId: string): Promise<SafeIntegrationMeta> {
    const existing = await this.integrationRepo.findByProvider(IntegrationProvider.HUBSPOT);
    if (existing && existing.status === "CONNECTED") {
      throw new AppError("HubSpot is already connected. Disconnect first before setting up a new connection.", 409);
    }

    // 1. Validate Token against REAL HubSpot API
    await hubspotClient.validateToken(accessToken);

    // 2. Encrypt Token
    const encryptedToken = encryptToken(accessToken);

    const connection = await prisma.$transaction(async (tx) => {
      const record = await tx.integrationConnection.upsert({
        where: { provider: IntegrationProvider.HUBSPOT },
        update: {
          accessToken: encryptedToken,
          status: "CONNECTED",
        },
        create: {
          provider: IntegrationProvider.HUBSPOT,
          accessToken: encryptedToken,
          status: "CONNECTED",
        },
      });

      const actionText = existing ? "HubSpot connection updated/reconnected" : "HubSpot connection created";
      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "HubSpot Connected",
          content: `${actionText}. Status set to CONNECTED.`,
          userId: currentUserId,
          metadata: {
            provider: IntegrationProvider.HUBSPOT,
            status: "CONNECTED",
            connectionId: record.id,
          },
        },
      });

      return record;
    });

    return this.toSafeMeta(connection);
  }

  async getHubspotStatus(): Promise<SafeIntegrationMeta> {
    const connection = await this.integrationRepo.findByProvider(IntegrationProvider.HUBSPOT);
    if (!connection) {
      throw new AppError("HubSpot connection configuration not found.", 404);
    }

    return this.toSafeMeta(connection);
  }

  async disconnectHubspot(currentUserId: string): Promise<SafeIntegrationMeta> {
    const existing = await this.integrationRepo.findByProvider(IntegrationProvider.HUBSPOT);
    if (!existing) {
      throw new AppError("HubSpot connection configuration not found.", 404);
    }

    // Atomically update connection status and insert activity log
    const connection = await prisma.$transaction(async (tx) => {
      const record = await tx.integrationConnection.update({
        where: { provider: IntegrationProvider.HUBSPOT },
        data: {
          accessToken: null,
          refreshToken: null,
          status: "DISCONNECTED",
        },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "HubSpot Disconnected",
          content: "HubSpot connection removed/disconnected. Credentials cleared.",
          userId: currentUserId,
          metadata: {
            provider: IntegrationProvider.HUBSPOT,
            status: "DISCONNECTED",
            connectionId: record.id,
          },
        },
      });

      return record;
    });

    return this.toSafeMeta(connection);
  }

  private toSafeMeta(connection: IntegrationConnection): SafeIntegrationMeta {
    return {
      id: connection.id,
      provider: connection.provider,
      status: connection.status,
      lastSyncAt: connection.lastSyncAt,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }
}

export const integrationService = new IntegrationService(integrationRepository);
