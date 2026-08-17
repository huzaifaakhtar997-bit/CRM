/**
 * Phase 8B – Campaign Audience Selection Integration Test Suite
 * ──────────────────────────────────────────────────────────────────────────
 * Tests audience preview, application, retrieval, and removal, including
 * RBAC policies, error handling, duplicate prevention, and activity logs.
 *
 * Run with:  npx ts-node run_campaign_audience_audit.ts
 */

import axios, { AxiosError } from "axios";
import { PrismaClient } from "@prisma/client";

const API = "http://localhost:5000/api/v1";
const prisma = new PrismaClient();

function ok(label: string, value?: unknown) {
  console.log(`   ✅  ${label}`, value !== undefined ? `→ ${JSON.stringify(value)}` : "");
}

function fail(label: string, detail: string) {
  console.error(`   ❌  ${label}: ${detail}`);
  process.exit(1);
}

async function expect401(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    fail(label, "Expected 401 but got success");
  } catch (e: unknown) {
    const err = e as AxiosError;
    if (err.response?.status === 401) ok(label + " → 401");
    else fail(label, `Expected 401, got ${err.response?.status}`);
  }
}

async function expect403(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    fail(label, "Expected 403 but got success");
  } catch (e: unknown) {
    const err = e as AxiosError;
    if (err.response?.status === 403) ok(label + " → 403");
    else fail(label, `Expected 403, got ${err.response?.status}`);
  }
}

async function expect404(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    fail(label, "Expected 404 but got success");
  } catch (e: unknown) {
    const err = e as AxiosError;
    if (err.response?.status === 404) ok(label + " → 404");
    else fail(label, `Expected 404, got ${err.response?.status}`);
  }
}

const TIMESTAMP = Date.now();
const adminEmail = `audit8b_admin_${TIMESTAMP}@crm.test`;
const salesEmail = `audit8b_sales_${TIMESTAMP}@crm.test`;
const PASSWORD = "Audit8b!Pass";

let adminToken = "";
let salesToken = "";
let campaignId = "";
let contactId1 = "";
let contactId2 = "";
let contactId3 = "";
let recipientIdToRemove = "";

async function main() {
  console.log("\n==================================================");
  console.log("   PHASE 8B — CAMPAIGN AUDIENCE AUDIT SUITE      ");
  console.log("==================================================\n");

  // 1. Bootstrap users and contacts
  console.log("1️⃣  Bootstrap Auth & Contacts…");
  await axios.post(`${API}/auth/register`, {
    name: "Audit Admin 8B",
    email: adminEmail,
    password: PASSWORD,
    role: "ADMIN",
  });

  await axios.post(`${API}/auth/register`, {
    name: "Audit Sales 8B",
    email: salesEmail,
    password: PASSWORD,
    role: "SALES_REP",
  });

  const adminLogin = await axios.post(`${API}/auth/login`, {
    email: adminEmail,
    password: PASSWORD,
  });
  adminToken = adminLogin.data.data.token;
  ok("Admin registered & logged in");

  const salesLogin = await axios.post(`${API}/auth/login`, {
    email: salesEmail,
    password: PASSWORD,
  });
  salesToken = salesLogin.data.data.token;
  ok("SALES_REP registered & logged in");

  // Create mock contacts
  const contact1 = await prisma.contact.create({
    data: {
      firstName: "AudienceMember",
      lastName: "One",
      email: `member1_${TIMESTAMP}@crm.test`,
      lifecycleStage: "MQL",
      tags: ["vip", "newsletter"],
    },
  });
  contactId1 = contact1.id;

  const contact2 = await prisma.contact.create({
    data: {
      firstName: "AudienceMember",
      lastName: "Two",
      email: `member2_${TIMESTAMP}@crm.test`,
      lifecycleStage: "MQL",
      tags: ["newsletter"],
    },
  });
  contactId2 = contact2.id;

  const contact3 = await prisma.contact.create({
    data: {
      firstName: "OtherPerson",
      lastName: "Three",
      email: `member3_${TIMESTAMP}@crm.test`,
      lifecycleStage: "LEAD",
      tags: ["vip"],
    },
  });
  contactId3 = contact3.id;

  ok("Created 3 sandbox Contacts for filtering tests");

  // Create Campaign
  const campaignRes = await axios.post(
    `${API}/campaigns`,
    {
      name: `Audience Campaign ${TIMESTAMP}`,
      subject: "Test Audience Campaign",
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  campaignId = campaignRes.data.data.campaign.id;
  ok("Created Target Campaign. ID: " + campaignId);

  // 2. RBAC checks
  console.log("\n2️⃣  RBAC checks (Missing JWT, SALES_REP block)…");
  await expect401("GET /audience without token", () =>
    axios.get(`${API}/campaigns/${campaignId}/audience`)
  );
  await expect403("SALES_REP apply audience", () =>
    axios.post(
      `${API}/campaigns/${campaignId}/audience/apply`,
      { filters: { lifecycleStage: "MQL" } },
      { headers: { Authorization: `Bearer ${salesToken}` } }
    )
  );

  // 3. Invalid Campaign 404
  console.log("\n3️⃣  404 on invalid Campaign ID…");
  await expect404("POST audience/preview with invalid ID", () =>
    axios.post(
      `${API}/campaigns/nonexistent-campaign-id/audience/preview`,
      { filters: { lifecycleStage: "MQL" } },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 4. Preview Audience
  console.log("\n4️⃣  Preview Audience (POST /audience/preview)…");
  const previewRes = await axios.post(
    `${API}/campaigns/${campaignId}/audience/preview`,
    {
      filters: { lifecycleStage: "MQL", tags: ["vip"] },
      page: 1,
      limit: 10,
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (previewRes.status !== 200) fail("Preview Audience", `Expected 200, got ${previewRes.status}`);
  const previewData = previewRes.data.data;
  if (previewData.total !== 1) fail("Preview filter matches", `Expected 1 match, got ${previewData.total}`);
  ok("Preview returned exactly 1 contact (MQL + vip): " + previewData.contacts[0].email);

  // 5. Apply Audience
  console.log("\n5️⃣  Apply Audience (POST /audience/apply)…");
  const applyRes = await axios.post(
    `${API}/campaigns/${campaignId}/audience/apply`,
    {
      filters: { lifecycleStage: "MQL" }, // Should match contact 1 and 2
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (applyRes.status !== 201) fail("Apply Audience", `Expected 201, got ${applyRes.status}`);
  const applyData = applyRes.data.data;
  if (applyData.createdCount !== 2) fail("Apply createdCount", `Expected 2, got ${applyData.createdCount}`);
  ok(`Applied audience. Created: ${applyData.createdCount}, skipped: ${applyData.skippedCount}, total: ${applyData.totalRecipients}`);

  // 6. Duplicate Apply
  console.log("\n6️⃣  Duplicate Apply (Should skip existing)…");
  const reapplyRes = await axios.post(
    `${API}/campaigns/${campaignId}/audience/apply`,
    {
      filters: { lifecycleStage: "MQL" },
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const reapplyData = reapplyRes.data.data;
  if (reapplyData.createdCount !== 0) fail("Reapply createdCount", `Expected 0, got ${reapplyData.createdCount}`);
  if (reapplyData.skippedCount !== 2) fail("Reapply skippedCount", `Expected 2, got ${reapplyData.skippedCount}`);
  ok("Duplicate application skipped existing campaign recipients successfully");

  // 7. View Audience list
  console.log("\n7️⃣  View Audience list (GET /audience)…");
  const viewRes = await axios.get(
    `${API}/campaigns/${campaignId}/audience?page=1&limit=10`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (viewRes.status !== 200) fail("View Audience", `Expected 200, got ${viewRes.status}`);
  const viewData = viewRes.data.data;
  if (viewData.total !== 2) fail("Audience total size", `Expected 2, got ${viewData.total}`);
  ok(`Audience list retrieved correctly. Total size: ${viewData.total}`);

  // Get one recipient ID for deletion test
  recipientIdToRemove = viewData.recipients[0].id;

  // 8. Search Audience list
  console.log("\n8️⃣  Search Audience list (GET /audience?search=)…");
  const searchRes = await axios.get(
    `${API}/campaigns/${campaignId}/audience?search=member2`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const searchData = searchRes.data.data;
  if (searchData.total !== 1) fail("Search Audience size", `Expected 1 match, got ${searchData.total}`);
  ok("Search returned correct matches: " + searchData.recipients[0].contact.email);

  // 9. Remove Recipient
  console.log("\n9️⃣  Remove Recipient (DELETE /audience/:recipientId)…");
  const removeRes = await axios.delete(
    `${API}/campaigns/${campaignId}/audience/${recipientIdToRemove}`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (removeRes.status !== 200) fail("Remove Recipient", `Expected 200, got ${removeRes.status}`);
  ok("Recipient removed. ID returned: " + removeRes.data.data.id);

  // Verify removed recipient is gone
  const verifyGoneRes = await axios.get(
    `${API}/campaigns/${campaignId}/audience`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const verifyGoneData = verifyGoneRes.data.data;
  if (verifyGoneData.total !== 1) fail("Audience size after removal", `Expected 1 remaining, got ${verifyGoneData.total}`);
  ok("Verified recipient was successfully removed from campaign audience");

  // 10. PostgreSQL check
  console.log("\n🔟  PostgreSQL Verification…");
  const dbRecipients = await prisma.campaignRecipient.findMany({
    where: { campaignId },
  });
  if (dbRecipients.length !== 1) fail("PostgreSQL records match", `Expected 1 in DB, got ${dbRecipients.length}`);
  ok("PostgreSQL correctly stores only active campaign recipients matching DB counts");

  // 11. Activity Log check
  console.log("\n1️⃣1️⃣  Activity Log Verification…");
  const appliedActivity = await prisma.activity.findFirst({
    where: { title: "Campaign Audience Applied", userId: (await prisma.user.findFirst({ where: { email: adminEmail } }))?.id },
  });
  if (!appliedActivity) fail("Activity Log", "Missing Campaign Audience Applied activity log");
  ok("Verified Activity Log: " + appliedActivity!.content);

  const removedActivity = await prisma.activity.findFirst({
    where: { title: "Campaign Recipient Removed", userId: (await prisma.user.findFirst({ where: { email: adminEmail } }))?.id },
  });
  if (!removedActivity) fail("Activity Log", "Missing Campaign Recipient Removed activity log");
  ok("Verified Activity Log: " + removedActivity!.content);

  // 12. Full Regression checks
  console.log("\n1️⃣2️⃣  Full Regression tests…");
  const campReg = await axios.get(`${API}/campaigns`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (campReg.status !== 200) fail("Regression: Campaigns", "GET /campaigns failed");
  ok("Campaigns CRUD: OK");

  const contactsReg = await axios.get(`${API}/contacts?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (contactsReg.status !== 200) fail("Regression: Contacts", "GET /contacts failed");
  ok("Contacts CRUD: OK");

  // Clean sandbox records
  await prisma.campaignRecipient.deleteMany({ where: { campaignId } });
  await prisma.campaign.delete({ where: { id: campaignId } });
  await prisma.contact.deleteMany({
    where: {
      id: { in: [contactId1, contactId2, contactId3] },
    },
  });

  await prisma.$disconnect();

  console.log("\n==================================================");
  console.log("   PHASE 8B — CAMPAIGN AUDIENCE AUDIT SUITE PASSED ");
  console.log("==================================================\n");
}

main().catch(async (e) => {
  console.error("❌ Audit suite crashed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
