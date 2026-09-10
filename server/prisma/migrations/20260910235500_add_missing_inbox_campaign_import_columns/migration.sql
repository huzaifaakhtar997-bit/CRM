-- AlterTable import_jobs
ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "importType" TEXT NOT NULL DEFAULT 'contacts';
ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "skippedRecords" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "import_jobs_importType_idx" ON "import_jobs"("importType");

-- AlterTable campaign_recipients
ALTER TABLE "campaign_recipients" ADD COLUMN IF NOT EXISTS "providerMessageId" TEXT;
ALTER TABLE "campaign_recipients" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_recipients_providerMessageId_key" ON "campaign_recipients"("providerMessageId");

-- AlterTable messages
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "providerMessageId" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "providerEventId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "messages_providerEventId_key" ON "messages"("providerEventId");
