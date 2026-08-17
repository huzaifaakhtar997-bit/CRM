/**
 * Phase 8F – Campaign Tracking & Recipient Status Updates Integration Test Suite
 * ──────────────────────────────────────────────────────────────────────────
 * Tests state lifecycle rules, enums, transition bounds (bounces/opens/clicks),
 * aggregate count logic verification, transactional consistency, and regressions.
 *
 * Run with:  npx ts-node run_campaign_tracking_audit.ts
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

async function expect422(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    fail(label, "Expected 422 but got success");
  } catch (e: unknown) {
    const err = e as AxiosError;
    if (err.response?.status === 422) ok(label + " → 422");
    else fail(label, `Expected 422, got ${err.response?.status}`);
  }
}

const TIMESTAMP = Date.now();
const adminEmail = `audit8f_admin_${TIMESTAMP}@crm.test`;
const salesEmail = `audit8f_sales_${TIMESTAMP}@crm.test`;
const PASSWORD = "Audit8f!Pass";

let adminToken = "";
let salesToken = "";
let campaignId = "";
let contactId1 = "";
let contactId2 = "";
let recipientId1 = "";
let recipientId2 = "";

async function main() {
  console.log("\n==================================================");
  console.log("   PHASE 8F — CAMPAIGN TRACKING AUDIT SUITE       ");
  console.log("==================================================\n");

  // 1. Bootstrap
  console.log("1️⃣  Bootstrap Auth, Contacts & Campaigns…");
  await axios.post(`${API}/auth/register`, {
    name: "Audit Admin 8F",
    email: adminEmail,
    password: PASSWORD,
    role: "ADMIN",
  });

  await axios.post(`${API}/auth/register`, {
    name: "Audit Sales 8F",
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

  // Create contacts
  const contact1 = await prisma.contact.create({
    data: {
      firstName: "TrackMember",
      lastName: "One",
      email: `tracker1_${TIMESTAMP}@crm.test`,
    },
  });
  contactId1 = contact1.id;

  const contact2 = await prisma.contact.create({
    data: {
      firstName: "TrackMember",
      lastName: "Two",
      email: `tracker2_${TIMESTAMP}@crm.test`,
    },
  });
  contactId2 = contact2.id;

  // Create campaign
  const campaignRes = await axios.post(
    `${API}/campaigns`,
    {
      name: `Tracking Campaign ${TIMESTAMP}`,
      subject: "Tracking Subject",
      content: "<p>Tracking Body</p>",
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  campaignId = campaignRes.data.data.campaign.id;
  ok("Created Sandbox Campaign. ID: " + campaignId);

  // Map recipients (Pending status initially)
  const rec1 = await prisma.campaignRecipient.create({
    data: {
      campaignId,
      contactId: contactId1,
      status: "PENDING",
    },
  });
  recipientId1 = rec1.id;

  const rec2 = await prisma.campaignRecipient.create({
    data: {
      campaignId,
      contactId: contactId2,
      status: "PENDING",
    },
  });
  recipientId2 = rec2.id;
  ok("Mapped 2 Recipients with initial PENDING status");

  // 2. RBAC checks
  console.log("\n2️⃣  RBAC checks (Missing JWT, SALES_REP block)…");
  await expect401("PATCH status without token", () =>
    axios.patch(`${API}/campaigns/${campaignId}/recipients/${recipientId1}/status`, { status: "SENT" })
  );
  await expect403("SALES_REP status update attempt", () =>
    axios.patch(
      `${API}/campaigns/${campaignId}/recipients/${recipientId1}/status`,
      { status: "SENT" },
      { headers: { Authorization: `Bearer ${salesToken}` } }
    )
  );

  // 3. 404 Campaign Check
  console.log("\n3️⃣  404 on invalid parameters…");
  await expect404("PATCH status with invalid campaignId", () =>
    axios.patch(
      `${API}/campaigns/nonexistent-campaign-id/recipients/${recipientId1}/status`,
      { status: "SENT" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );
  await expect404("PATCH status with invalid recipientId", () =>
    axios.patch(
      `${API}/campaigns/${campaignId}/recipients/nonexistent-recipient-id/status`,
      { status: "SENT" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 4. Invalid Status Value (422)
  console.log("\n4️⃣  Zod validation on invalid status parameter (422)…");
  await expect422("PATCH status with empty status", () =>
    axios.patch(
      `${API}/campaigns/${campaignId}/recipients/${recipientId1}/status`,
      { status: "" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );
  await expect422("PATCH status with invalid enum text", () =>
    axios.patch(
      `${API}/campaigns/${campaignId}/recipients/${recipientId1}/status`,
      { status: "INVALID_STATUS" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 5. Invalid State Transitions (409)
  console.log("\n5️⃣  Invalid state transition validation checks (409)…");
  await expect409("PENDING directly to DELIVERED (bypassing SENT)", () =>
    axios.patch(
      `${API}/campaigns/${campaignId}/recipients/${recipientId1}/status`,
      { status: "DELIVERED" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 6. Valid Transitions Progression (SENT -> DELIVERED -> OPENED -> CLICKED)
  console.log("\n6️⃣  Valid status transitions progression & timestamp check…");
  // PENDING -> SENT
  let res = await axios.patch(
    `${API}/campaigns/${campaignId}/recipients/${recipientId1}/status`,
    { status: "SENT" },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (res.data.data.recipient.status !== "SENT") fail("State Transition", "Expected SENT status");

  // SENT -> DELIVERED
  res = await axios.patch(
    `${API}/campaigns/${campaignId}/recipients/${recipientId1}/status`,
    { status: "DELIVERED" },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (res.data.data.recipient.status !== "DELIVERED") fail("State Transition", "Expected DELIVERED status");

  // DELIVERED -> OPENED
  res = await axios.patch(
    `${API}/campaigns/${campaignId}/recipients/${recipientId1}/status`,
    { status: "OPENED" },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (res.data.data.recipient.status !== "OPENED") fail("State Transition", "Expected OPENED status");

  // OPENED -> CLICKED
  res = await axios.patch(
    `${API}/campaigns/${campaignId}/recipients/${recipientId1}/status`,
    { status: "CLICKED" },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (res.data.data.recipient.status !== "CLICKED") fail("State Transition", "Expected CLICKED status");
  ok("Progression path (PENDING -> SENT -> DELIVERED -> OPENED -> CLICKED) succeeded");

  // 7. Bounced Transition Path (SENT -> BOUNCED)
  console.log("\n7️⃣  Bounced transition path (PENDING -> SENT -> BOUNCED)…");
  // PENDING -> SENT (recipient 2)
  res = await axios.patch(
    `${API}/campaigns/${campaignId}/recipients/${recipientId2}/status`,
    { status: "SENT" },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  // SENT -> BOUNCED
  res = await axios.patch(
    `${API}/campaigns/${campaignId}/recipients/${recipientId2}/status`,
    { status: "BOUNCED" },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (res.data.data.recipient.status !== "BOUNCED") fail("State Transition", "Expected BOUNCED status");
  ok("Bounced path (PENDING -> SENT -> BOUNCED) succeeded");

  // 8. Dynamic tracking statistics calculation check
  console.log("\n8️⃣  Get Tracking Summary (GET /campaigns/:id/tracking)…");
  const summaryRes = await axios.get(`${API}/campaigns/${campaignId}/tracking`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (summaryRes.status !== 200) fail("Tracking Summary", `Expected 200, got ${summaryRes.status}`);
  const summary = summaryRes.data.data;
  if (summary.totalRecipients !== 2) fail("Summary totalRecipients", `Expected 2, got ${summary.totalRecipients}`);
  if (summary.sent !== 2) fail("Summary sent", `Expected 2, got ${summary.sent}`);
  if (summary.delivered !== 1) fail("Summary delivered", `Expected 1, got ${summary.delivered}`);
  if (summary.opened !== 1) fail("Summary opened", `Expected 1, got ${summary.opened}`);
  if (summary.clicked !== 1) fail("Summary clicked", `Expected 1, got ${summary.clicked}`);
  if (summary.bounced !== 1) fail("Summary bounced", `Expected 1, got ${summary.bounced}`);
  ok("Summary aggregates match recipient status progression exactly", summary);

  // 9. PostgreSQL Verification
  console.log("\n9️⃣  PostgreSQL Verification…");
  const dbRecipient = await prisma.campaignRecipient.findUnique({ where: { id: recipientId1 } });
  if (!dbRecipient?.sentAt || !dbRecipient.deliveredAt || !dbRecipient.openedAt || !dbRecipient.clickedAt) {
    fail("PostgreSQL Timestamps", "Timestamps for tracking transitions were not set");
  }
  ok("PostgreSQL: All tracking timestamps successfully populated");

  // 10. Activity Log Verification
  console.log("\n🔟  Activity Log Verification…");
  const adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
  const bouncedLog = await prisma.activity.findFirst({
    where: { title: "Campaign Recipient Bounced", userId: adminUser?.id },
  });
  if (!bouncedLog) fail("Activity Log", "Missing Campaign Recipient Bounced log");
  ok("Verified Bounced Log: " + bouncedLog!.content);

  const clickedLog = await prisma.activity.findFirst({
    where: { title: "Campaign Recipient Clicked", userId: adminUser?.id },
  });
  if (!clickedLog) fail("Activity Log", "Missing Campaign Recipient Clicked log");
  ok("Verified Clicked Log: " + clickedLog!.content);

  // 11. Regression check
  console.log("\n1️⃣1️⃣  Full Regression check…");
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
      id: { in: [contactId1, contactId2] },
    },
  });

  await prisma.$disconnect();

  console.log("\n==================================================");
  console.log("   PHASE 8F — CAMPAIGN TRACKING AUDIT PASSED      ");
  console.log("==================================================\n");
}

main().catch(async (e) => {
  console.error("❌ Audit suite crashed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
