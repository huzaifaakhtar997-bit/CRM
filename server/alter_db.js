const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "campaign_recipients" ADD COLUMN "providerMessageId" TEXT, ADD COLUMN "errorMessage" TEXT;');
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX "campaign_recipients_providerMessageId_key" ON "campaign_recipients"("providerMessageId");');
  console.log('Schema updated manually.');
  await prisma.$disconnect();
}
main().catch(console.error);
