-- Sync contacts from conversations where conversation is assigned
UPDATE "contacts" c
SET "assignedUserId" = conv."assignedUserId"
FROM "conversations" conv
WHERE conv."contactId" = c.id
  AND conv."assignedUserId" IS NOT NULL
  AND (c."assignedUserId" IS NULL OR c."assignedUserId" != conv."assignedUserId");

-- Sync deals from contacts where contact is assigned
UPDATE "deals" d
SET "assignedUserId" = c."assignedUserId"
FROM "contacts" c
WHERE d."contactId" = c.id
  AND c."assignedUserId" IS NOT NULL
  AND (d."assignedUserId" IS NULL OR d."assignedUserId" != c."assignedUserId");
