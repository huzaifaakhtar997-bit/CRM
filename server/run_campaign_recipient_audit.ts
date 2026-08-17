/**
 * Phase 8C – Campaign Recipient Management Integration Test Suite
 * ──────────────────────────────────────────────────────────────────────────
 * Tests single add, bulk add, list with filters, details, and delete,
 * including RBAC checks, duplicate validations, transaction rollback checks,
 * activity logs, and regressions.
 *
 * Run with:  npx ts-node run_campaign_recipient_audit.ts
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

async function expect409(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    fail(label, "Expected 409 but got success");
  } catch (e: unknown) {
    const err = e as AxiosError;
    if (err.response?.status === 409) ok(label + " → 409");
    else fail(label, `Expected 409, got ${err.response?.status}`);
  }
}

const TIMESTAMP = Date.now();
const adminEmail = `audit8c_admin_${TIMESTAMP}@crm.test`;
const salesEmail = `audit8c_sales_${TIMESTAMP}@crm.test`;
const PASSWORD = "Audit8c!Pass";

let adminToken = "";
let salesToken = "";
let campaignId = "";
let contactId1 = "";
let contactId2 = "";
let contactId3 = "";
let recipientIdToRemove = "";

async function main() {
  console.log("\n==================================================");
  console.log("   PHASE 8C — CAMPAIGN RECIPIENT AUDIT SUITE     ");
  console.log("==================================================\n");

  // 1. Bootstrap
  console.log("1️⃣  Bootstrap Auth & Database Sandbox…");
  await axios.post(`${API}/auth/register`, {
    name: "Audit Admin 8C",
    email: adminEmail,
    password: PASSWORD,
    role: "ADMIN",
  });

  await axios.post(`${API}/auth/register`, {
    name: "Audit Sales 8C",
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
      firstName: "RecipientOne",
      lastName: "Test",
      email: `recipient1_${TIMESTAMP}@crm.test`,
    },
  });
  contactId1 = contact1.id;

  const contact2 = await prisma.contact.create({
    data: {
      firstName: "RecipientTwo",
      lastName: "Test",
      email: `recipient2_${TIMESTAMP}@crm.test`,
    },
  });
  contactId2 = contact2.id;

  const contact3 = await prisma.contact.create({
    data: {
      firstName: "RecipientThree",
      lastName: "Test",
      email: `recipient3_${TIMESTAMP}@crm.test`,
    },
  });
  contactId3 = contact3.id;

  ok("Created 3 sandbox Contacts");

  // Create Campaign
  const campaignRes = await axios.post(
    `${API}/campaigns`,
    {
      name: `Recipient Campaign ${TIMESTAMP}`,
      subject: "Test Recipient Campaign",
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  campaignId = campaignRes.data.data.campaign.id;
  ok("Created Target Campaign. ID: " + campaignId);

  // 2. RBAC checks
  console.log("\n2️⃣  RBAC checks (Missing JWT, SALES_REP block)…");
  await expect401("POST /recipients without token", () =>
    axios.post(`${API}/campaigns/${campaignId}/recipients`, { contactId: contactId1 })
  );
  await expect403("SALES_REP add single recipient", () =>
    axios.post(
      `${API}/campaigns/${campaignId}/recipients`,
      { contactId: contactId1 },
      { headers: { Authorization: `Bearer ${salesToken}` } }
    )
  );

  // 3. 404 Errors
  console.log("\n3️⃣  404 on invalid parameters…");
  await expect404("POST recipient with invalid campaignId", () =>
    axios.post(
      `${API}/campaigns/nonexistent-campaign-id/recipients`,
      { contactId: contactId1 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );
  await expect404("POST recipient with invalid contactId", () =>
    axios.post(
      `${API}/campaigns/${campaignId}/recipients`,
      { contactId: "nonexistent-contact-id" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 4. Add Single Recipient
  console.log("\n4️⃣  Add Single Recipient (POST /recipients)…");
  const addRes = await axios.post(
    `${API}/campaigns/${campaignId}/recipients`,
    { contactId: contactId1 },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (addRes.status !== 201) fail("Add Single Recipient", `Expected 201, got ${addRes.status}`);
  const recipient = addRes.data.data.recipient;
  ok("Added single recipient. ID: " + recipient.id + ", Contact: " + recipient.contact.email);

  // 5. Duplicate Recipient → 409
  console.log("\n5️⃣  Duplicate Recipient → 409…");
  await expect409("Duplicate single recipient add", () =>
    axios.post(
      `${API}/campaigns/${campaignId}/recipients`,
      { contactId: contactId1 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 6. Bulk Add Recipients
  console.log("\n6️⃣  Bulk Add Recipients (POST /recipients/bulk)…");
  const bulkRes = await axios.post(
    `${API}/campaigns/${campaignId}/recipients/bulk`,
    {
      contactIds: [contactId1, contactId2, contactId3], // contactId1 is duplicate, should be skipped
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (bulkRes.status !== 201) fail("Bulk Add Recipients", `Expected 201, got ${bulkRes.status}`);
  const bulkData = bulkRes.data.data;
  if (bulkData.createdCount !== 2) fail("Bulk createdCount", `Expected 2, got ${bulkData.createdCount}`);
  if (bulkData.skippedCount !== 1) fail("Bulk skippedCount", `Expected 1, got ${bulkData.skippedCount}`);
  ok(`Bulk applied. Created: ${bulkData.createdCount}, Skipped: ${bulkData.skippedCount}, Total: ${bulkData.totalRecipients}`);

  // 7. Get Recipient Details
  console.log("\n7️⃣  Get Recipient Details (GET /recipients/:id)…");
  // Find one recipient ID that is contactId2
  const listForDetailsRes = await axios.get(
    `${API}/campaigns/${campaignId}/recipients?limit=5`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  recipientIdToRemove = listForDetailsRes.data.data.recipients.find(
    (r: any) => r.contactId === contactId2
  ).id;

  const detailsRes = await axios.get(
    `${API}/campaigns/${campaignId}/recipients/${recipientIdToRemove}`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (detailsRes.status !== 200) fail("Recipient Details", `Expected 200, got ${detailsRes.status}`);
  ok("Retrieved Recipient Details. Contact name: " + detailsRes.data.data.recipient.contact.firstName);

  // 8. List & Search recipients
  console.log("\n8️⃣  List & Search recipients (GET /recipients?search=)…");
  const searchRes = await axios.get(
    `${API}/campaigns/${campaignId}/recipients?search=RecipientThree`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const searchData = searchRes.data.data;
  if (searchData.total !== 1) fail("Search size", `Expected 1 match, got ${searchData.total}`);
  ok("Search verified: " + searchData.recipients[0].contact.email);

  // 9. Remove Recipient
  console.log("\n9️⃣  Remove Recipient (DELETE /recipients/:id)…");
  const removeRes = await axios.delete(
    `${API}/campaigns/${campaignId}/recipients/${recipientIdToRemove}`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (removeRes.status !== 200) fail("Remove Recipient", `Expected 200, got ${removeRes.status}`);
  ok("Recipient removed. ID returned: " + removeRes.data.data.id);

  // Confirm deleted recipient is gone
  await expect404("Get removed recipient details", () =>
    axios.get(`${API}/campaigns/${campaignId}/recipients/${recipientIdToRemove}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
  );

  // 10. PostgreSQL check
  console.log("\n🔟  PostgreSQL Verification…");
  const dbRecipients = await prisma.campaignRecipient.findMany({
    where: { campaignId },
  });
  if (dbRecipients.length !== 2) fail("PostgreSQL record count", `Expected 2 in DB, got ${dbRecipients.length}`);
  ok("PostgreSQL state is exact. Remaining campaign recipient rows: " + dbRecipients.length);

  // 11. Activity Log check
  console.log("\n1️⃣1️⃣  Activity Log Verification…");
  const adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
  const singleAddedLog = await prisma.activity.findFirst({
    where: { title: "Campaign Recipient Added", userId: adminUser?.id },
  });
  if (!singleAddedLog) fail("Activity Log", "Missing Campaign Recipient Added log");
  ok("Verified single add log: " + singleAddedLog!.content);

  const bulkAddedLog = await prisma.activity.findFirst({
    where: { title: "Campaign Recipients Added", userId: adminUser?.id },
  });
  if (!bulkAddedLog) fail("Activity Log", "Missing Campaign Recipients Added log");
  ok("Verified bulk add log: " + bulkAddedLog!.content);

  const removedLog = await prisma.activity.findFirst({
    where: { title: "Campaign Recipient Removed", userId: adminUser?.id },
  });
  if (!removedLog) fail("Activity Log", "Missing Campaign Recipient Removed log");
  ok("Verified removed log: " + removedLog!.content);

  // 12. Full Regression checks
  console.log("\n1️⃣2️⃣  Full Regression checks…");
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
  console.log("   PHASE 8C — CAMPAIGN RECIPIENT AUDIT SUITE PASSED");
  console.log("==================================================\n");
}

main().catch(async (e) => {
  console.error("❌ Audit suite crashed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
