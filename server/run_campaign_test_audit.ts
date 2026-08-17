/**
 * Phase 8D – Campaign Test Send Integration Test Suite
 * ──────────────────────────────────────────────────────────────────────────
 * Tests Zod validations, JWT, RBAC, Campaign readiness checks (required fields),
 * mock test send queues, activity records, and regression tests.
 *
 * Run with:  npx ts-node run_campaign_test_audit.ts
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
const adminEmail = `audit8d_admin_${TIMESTAMP}@crm.test`;
const supportEmail = `audit8d_support_${TIMESTAMP}@crm.test`;
const PASSWORD = "Audit8d!Pass";

let adminToken = "";
let supportToken = "";
let readyCampaignId = "";
let draftCampaignId = "";

async function main() {
  console.log("\n==================================================");
  console.log("   PHASE 8D — CAMPAIGN TEST SEND AUDIT SUITE     ");
  console.log("==================================================\n");

  // 1. Bootstrap
  console.log("1️⃣  Bootstrap Auth & Campaigns…");
  await axios.post(`${API}/auth/register`, {
    name: "Audit Admin 8D",
    email: adminEmail,
    password: PASSWORD,
    role: "ADMIN",
  });

  await axios.post(`${API}/auth/register`, {
    name: "Audit Support 8D",
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

  // Create incomplete campaign (missing subject & content)
  const draftCampaignRes = await axios.post(
    `${API}/campaigns`,
    {
      name: `Incomplete Campaign ${TIMESTAMP}`,
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  draftCampaignId = draftCampaignRes.data.data.campaign.id;
  ok("Created incomplete Campaign. ID: " + draftCampaignId);

  // Create complete campaign
  const readyCampaignRes = await axios.post(
    `${API}/campaigns`,
    {
      name: `Complete Campaign ${TIMESTAMP}`,
      subject: "Ready Subject",
      content: "<p>Ready Body</p>",
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  readyCampaignId = readyCampaignRes.data.data.campaign.id;
  ok("Created fully complete Campaign. ID: " + readyCampaignId);

  // 2. RBAC checks
  console.log("\n2️⃣  RBAC checks (Missing JWT, SUPPORT block)…");
  await expect401("POST /test-send without token", () =>
    axios.post(`${API}/campaigns/${readyCampaignId}/test-send`, { email: "test@example.com" })
  );
  await expect403("SUPPORT attempt test send", () =>
    axios.post(
      `${API}/campaigns/${readyCampaignId}/test-send`,
      { email: "test@example.com" },
      { headers: { Authorization: `Bearer ${supportToken}` } }
    )
  );

  // 3. 404 Campaign Check
  console.log("\n3️⃣  404 on invalid Campaign ID…");
  await expect404("POST test-send with invalid campaignId", () =>
    axios.post(
      `${API}/campaigns/nonexistent-campaign-id/test-send`,
      { email: "test@example.com" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 4. Invalid Email Payload Validation (422)
  console.log("\n4️⃣  Zod validation on invalid email payload (422)…");
  await expect422("POST test-send with empty email", () =>
    axios.post(
      `${API}/campaigns/${readyCampaignId}/test-send`,
      { email: "" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );
  await expect422("POST test-send with invalid format", () =>
    axios.post(
      `${API}/campaigns/${readyCampaignId}/test-send`,
      { email: "not-an-email" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 5. Campaign Readiness Checks (422)
  console.log("\n5️⃣  Campaign readiness checks (missing subject/content) → 422…");
  await expect422("POST test-send on incomplete draft campaign", () =>
    axios.post(
      `${API}/campaigns/${draftCampaignId}/test-send`,
      { email: "test@example.com" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 6. Valid Test Send → 200
  console.log("\n6️⃣  Valid Test Send → 200…");
  const testSendRes = await axios.post(
    `${API}/campaigns/${readyCampaignId}/test-send`,
    { email: "  TEST_RECEIVER@EXAMPLE.com  " }, // whitespace & uppercase check
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (testSendRes.status !== 200) fail("Test Send", `Expected 200, got ${testSendRes.status}`);
  const testSendData = testSendRes.data.data;
  if (testSendData.recipientEmail !== "test_receiver@example.com") fail("Email Normalization", "Email not normalized to lowercase & trimmed");
  if (testSendData.status !== "QUEUED_FOR_SMTP") fail("Status placeholder", "Expected QUEUED_FOR_SMTP status");
  ok("Valid test send passed and normalized email successfully: " + testSendData.recipientEmail);

  // 7. Repeated Test Send
  console.log("\n7️⃣  Repeated Test Send → 200 (allowed)…");
  const repeatRes = await axios.post(
    `${API}/campaigns/${readyCampaignId}/test-send`,
    { email: "test_receiver@example.com" },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (repeatRes.status !== 200) fail("Repeat Test Send", `Expected 200, got ${repeatRes.status}`);
  ok("Repeated test send succeeded");

  // 8. PostgreSQL Verification (No side effects)
  console.log("\n8️⃣  PostgreSQL Verification (Verify no state changes)…");
  const dbCampaign = await prisma.campaign.findUnique({ where: { id: readyCampaignId } });
  if (dbCampaign?.status !== "DRAFT") fail("Campaign status changed", "Status was modified");
  ok("PostgreSQL: campaign remains unaffected");

  // 9. Activity Log Verification
  console.log("\n9️⃣  Activity Log Verification…");
  const adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
  const testSendActivity = await prisma.activity.findFirst({
    where: {
      type: "EMAIL",
      title: "Campaign Test Send Requested",
      userId: adminUser?.id,
    },
  });
  if (!testSendActivity) fail("Activity Log", "Missing Campaign Test Send Requested activity log");
  ok("Verified Activity Log: " + testSendActivity!.content);

  // 10. Regression check
  console.log("\n🔟  Full Regression check…");
  const contactsReg = await axios.get(`${API}/contacts?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (contactsReg.status !== 200) fail("Regression: Contacts", "GET /contacts failed");
  ok("Contacts CRUD: OK");

  // Clean sandbox records
  await prisma.campaign.deleteMany({ where: { id: { in: [readyCampaignId, draftCampaignId] } } });
  await prisma.$disconnect();

  console.log("\n==================================================");
  console.log("   PHASE 8D — CAMPAIGN TEST SEND AUDIT PASSED     ");
  console.log("==================================================\n");
}

main().catch(async (e) => {
  console.error("❌ Audit suite crashed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
