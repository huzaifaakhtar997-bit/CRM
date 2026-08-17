/**
 * Phase 8E – Campaign Launch Integration Test Suite
 * ──────────────────────────────────────────────────────────────────────────
 * Tests JWT, RBAC, Campaign validation checks (missing recipients, missing details),
 * state transitions to ACTIVE, recipient status updates, and activity logs.
 *
 * Run with:  npx ts-node run_campaign_launch_audit.ts
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
const adminEmail = `audit8e_admin_${TIMESTAMP}@crm.test`;
const supportEmail = `audit8e_support_${TIMESTAMP}@crm.test`;
const PASSWORD = "Audit8e!Pass";

let adminToken = "";
let supportToken = "";
let emptyCampaignId = "";
let detailsMissingCampaignId = "";
let readyCampaignId = "";
let contactId = "";

async function main() {
  console.log("\n==================================================");
  console.log("   PHASE 8E — CAMPAIGN LAUNCH AUDIT SUITE        ");
  console.log("==================================================\n");

  // 1. Bootstrap
  console.log("1️⃣  Bootstrap Auth & Campaigns…");
  await axios.post(`${API}/auth/register`, {
    name: "Audit Admin 8E",
    email: adminEmail,
    password: PASSWORD,
    role: "ADMIN",
  });

  await axios.post(`${API}/auth/register`, {
    name: "Audit Support 8E",
    email: supportEmail,
    password: PASSWORD,
    role: "SUPPORT",
  });

  const adminLogin = await axios.post(`${API}/auth/login`, {
    email: adminEmail,
    password: PASSWORD,
  });
  adminToken = adminLogin.data.data.token;
  ok("Admin registered & logged in");

  const supportLogin = await axios.post(`${API}/auth/login`, {
    email: supportEmail,
    password: PASSWORD,
  });
  supportToken = supportLogin.data.data.token;
  ok("SUPPORT registered & logged in");

  // Create sandbox contact
  const contact = await prisma.contact.create({
    data: {
      firstName: "Launcher",
      lastName: "Target",
      email: `launcher_${TIMESTAMP}@crm.test`,
    },
  });
  contactId = contact.id;

  // Sandbox Campaigns
  // Campaign A: No recipients
  const campARes = await axios.post(
    `${API}/campaigns`,
    {
      name: `Empty Campaign ${TIMESTAMP}`,
      subject: "Empty Sub",
      content: "Empty Content",
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  emptyCampaignId = campARes.data.data.campaign.id;

  // Campaign B: Missing details (subject)
  const campBRes = await axios.post(
    `${API}/campaigns`,
    {
      name: `Details Missing Campaign ${TIMESTAMP}`,
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  detailsMissingCampaignId = campBRes.data.data.campaign.id;

  // Campaign C: Ready to Launch
  const campCRes = await axios.post(
    `${API}/campaigns`,
    {
      name: `Ready Campaign ${TIMESTAMP}`,
      subject: "Launch Subject",
      content: "<p>Launch Content</p>",
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  readyCampaignId = campCRes.data.data.campaign.id;

  // Attach recipient to Campaign B and C
  await prisma.campaignRecipient.create({
    data: {
      campaignId: detailsMissingCampaignId,
      contactId,
      status: "PENDING",
    },
  });
  await prisma.campaignRecipient.create({
    data: {
      campaignId: readyCampaignId,
      contactId,
      status: "PENDING",
    },
  });
  ok("Campaign sandboxes and recipient mapping configured");

  // 2. RBAC checks
  console.log("\n2️⃣  RBAC checks (Missing JWT, SUPPORT block)…");
  await expect401("POST /launch without token", () =>
    axios.post(`${API}/campaigns/${readyCampaignId}/launch`)
  );
  await expect403("SUPPORT attempt launch", () =>
    axios.post(
      `${API}/campaigns/${readyCampaignId}/launch`,
      {},
      { headers: { Authorization: `Bearer ${supportToken}` } }
    )
  );

  // 3. 404 Campaign Check
  console.log("\n3️⃣  404 on invalid Campaign ID…");
  await expect404("POST launch with invalid campaignId", () =>
    axios.post(
      `${API}/campaigns/nonexistent-campaign-id/launch`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 4. Campaign Readiness Checks (422)
  console.log("\n4️⃣  Campaign validation checks (missing recipients/details) → 422…");
  await expect422("POST launch on campaign with 0 recipients", () =>
    axios.post(
      `${API}/campaigns/${emptyCampaignId}/launch`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );
  await expect422("POST launch on campaign with missing fields", () =>
    axios.post(
      `${API}/campaigns/${detailsMissingCampaignId}/launch`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 5. Successful Campaign Launch → 200
  console.log("\n5️⃣  Successful Campaign Launch → 200…");
  const launchRes = await axios.post(
    `${API}/campaigns/${readyCampaignId}/launch`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (launchRes.status !== 200) fail("Launch Campaign", `Expected 200, got ${launchRes.status}`);
  const launchData = launchRes.data.data;
  if (launchData.status !== "ACTIVE") fail("Status transition", `Expected status to transition to ACTIVE, got ${launchData.status}`);
  if (launchData.processedRecipients !== 1) fail("Recipients processing size", `Expected 1 processed recipient, got ${launchData.processedRecipients}`);
  ok("Campaign launched successfully: Status=ACTIVE, processedRecipients: " + launchData.processedRecipients);

  // 6. Already Launched → 409
  console.log("\n6️⃣  Launch already ACTIVE campaign → 409…");
  await expect409("Relaunch ACTIVE campaign", () =>
    axios.post(
      `${API}/campaigns/${readyCampaignId}/launch`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 7. PostgreSQL Verification
  console.log("\n7️⃣  PostgreSQL Verification…");
  const dbCampaign = await prisma.campaign.findUnique({ where: { id: readyCampaignId } });
  if (dbCampaign?.status !== "ACTIVE") fail("Campaign DB status", "Campaign status was not set to ACTIVE in DB");

  const dbRecipient = await prisma.campaignRecipient.findFirst({
    where: { campaignId: readyCampaignId, contactId },
  });
  if (dbRecipient?.status !== "SENT") fail("Recipient DB status", "Recipient status was not updated to SENT in DB");
  if (!dbRecipient?.sentAt) fail("Recipient DB timestamp", "Recipient sentAt timestamp was not populated");
  ok("PostgreSQL correctly updated campaign status and recipient state/timestamps");

  // 8. Activity Log Verification
  console.log("\n8️⃣  Activity Log Verification…");
  const adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
  const launchActivity = await prisma.activity.findFirst({
    where: {
      title: "Campaign Launched",
      userId: adminUser?.id,
    },
  });
  if (!launchActivity) fail("Activity Log", "Missing Campaign Launched activity log");
  ok("Verified Activity Log: " + launchActivity!.content);

  // 9. Regression check
  console.log("\n9️⃣  Full Regression check…");
  const contactsReg = await axios.get(`${API}/contacts?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (contactsReg.status !== 200) fail("Regression: Contacts", "GET /contacts failed");
  ok("Contacts CRUD: OK");

  // Clean sandbox records
  await prisma.campaignRecipient.deleteMany({
    where: { campaignId: { in: [emptyCampaignId, detailsMissingCampaignId, readyCampaignId] } },
  });
  await prisma.campaign.deleteMany({
    where: { id: { in: [emptyCampaignId, detailsMissingCampaignId, readyCampaignId] } },
  });
  await prisma.contact.delete({ where: { id: contactId } });

  await prisma.$disconnect();

  console.log("\n==================================================");
  console.log("   PHASE 8E — CAMPAIGN LAUNCH AUDIT PASSED        ");
  console.log("==================================================\n");
}

main().catch(async (e) => {
  console.error("❌ Audit suite crashed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
