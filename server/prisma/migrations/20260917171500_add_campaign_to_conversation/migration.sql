-- AlterTable conversations
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "campaignId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "conversations_campaignId_idx" ON "conversations"("campaignId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conversations_campaignId_fkey'
  ) THEN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
