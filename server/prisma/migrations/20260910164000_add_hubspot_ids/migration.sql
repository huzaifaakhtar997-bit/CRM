-- AlterTable
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "hubspotId" TEXT;

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "hubspotId" TEXT;

-- AlterTable
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "hubspotId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "companies_hubspotId_key" ON "companies"("hubspotId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "contacts_hubspotId_key" ON "contacts"("hubspotId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "deals_hubspotId_key" ON "deals"("hubspotId");
