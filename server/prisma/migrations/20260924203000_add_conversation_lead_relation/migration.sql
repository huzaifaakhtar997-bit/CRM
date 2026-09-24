-- AlterTable
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "leadId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "conversations_leadId_idx" ON "conversations"("leadId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'conversations_leadId_fkey'
    ) THEN
        ALTER TABLE "conversations" ADD CONSTRAINT "conversations_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
