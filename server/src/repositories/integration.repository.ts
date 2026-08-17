import { IntegrationConnection, IntegrationProvider } from "@prisma/client";
import { prisma } from "../config/database";

export class IntegrationRepository {
  async findByProvider(provider: IntegrationProvider): Promise<IntegrationConnection | null> {
    return prisma.integrationConnection.findUnique({
      where: { provider },
    });
  }

  async upsertHubspot(accessToken: string): Promise<IntegrationConnection> {
    return prisma.integrationConnection.upsert({
      where: { provider: IntegrationProvider.HUBSPOT },
      update: {
        accessToken,
        status: "CONNECTED",
      },
      create: {
        provider: IntegrationProvider.HUBSPOT,
        accessToken,
        status: "CONNECTED",
      },
    });
  }

  async disconnectHubspot(): Promise<IntegrationConnection> {
    return prisma.integrationConnection.update({
      where: { provider: IntegrationProvider.HUBSPOT },
      data: {
        accessToken: null,
        status: "DISCONNECTED",
      },
    });
  }
}

export const integrationRepository = new IntegrationRepository();
