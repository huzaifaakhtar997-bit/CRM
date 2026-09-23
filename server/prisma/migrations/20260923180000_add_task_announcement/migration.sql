-- AlterTable
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "isAnnouncement" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tasks_isAnnouncement_idx" ON "tasks"("isAnnouncement");
