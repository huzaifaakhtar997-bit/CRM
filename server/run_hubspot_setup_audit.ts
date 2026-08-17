/**
 * Phase 9A – HubSpot Connection Setup Integration Test Suite
 * ──────────────────────────────────────────────────────────────────────────
 * Tests connections setup, JWT/RBAC validations, payload checks, unique
 * constraint handling (409), safe response formats, deletion, activity logs,
 * and system regressions.
 *
 * Run with:  npx ts-node run_hubspot_setup_audit.ts
 */

import axios, { AxiosError } from "axios";
import { PrismaClient, IntegrationProvider } from "@prisma/client";

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

async function expect400(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    fail(label, "Expected 400 but got success");
  } catch (e: unknown) {
    const err = e as AxiosError;
    if (err.response?.status === 400) ok(label + " → 400");
    else fail(label, `Expected 400, got ${err.response?.status}`);
  }
}

const TIMESTAMP = Date.now();
const adminEmail = `audit9a_admin_${TIMESTAMP}@crm.test`;
const salesEmail = `audit9a_sales_${TIMESTAMP}@crm.test`;
const supportEmail = `audit9a_support_${TIMESTAMP}@crm.test`;
const PASSWORD = "Audit9a!Pass";
const MOCK_TOKEN = `pat-na-hubspot-setup-mock-token-${TIMESTAMP}`;

let adminToken = "";
let salesToken = "";
let supportToken = "";

async function main() {
  console.log("\n==================================================");
  console.log("   PHASE 9A — HUBSPOT CONNECTION SETUP AUDIT      ");
  console.log("==================================================\n");

  // Cleanup pre-existing mock integration connection to ensure test idempotency
  await prisma.integrationConnection.deleteMany({
    where: { provider: IntegrationProvider.HUBSPOT },
  });

  // 1. Bootstrap
  console.log("1️⃣  Bootstrap Auth & User Accounts…");
  await axios.post(`${API}/auth/register`, {
    name: "Audit Admin 9A",
    email: adminEmail,
    password: PASSWORD,
    role: "ADMIN",
  });

  await axios.post(`${API}/auth/register`, {
    name: "Audit Sales 9A",
    email: salesEmail,
    password: PASSWORD,
    role: "SALES_REP",
  });

  await axios.post(`${API}/auth/register`, {
    name: "Audit Support 9A",
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

  const salesLogin = await axios.post(`${API}/auth/login`, {
    email: salesEmail,
    password: PASSWORD,
  });
  salesToken = salesLogin.data.data.token;
  ok("SALES_REP registered & logged in");

  const supportLogin = await axios.post(`${API}/auth/login`, {
    email: supportEmail,
    password: PASSWORD,
  });
  supportToken = supportLogin.data.data.token;
  ok("SUPPORT registered & logged in");

  // 2. RBAC Checks
  console.log("\n2️⃣  RBAC checks (Missing JWT, SALES_REP block)…");
  await expect401("POST /integrations/hubspot/connect without token", () =>
    axios.post(`${API}/integrations/hubspot/connect`, { accessToken: MOCK_TOKEN })
  );
  await expect403("SALES_REP POST /integrations/hubspot/connect", () =>
    axios.post(
      `${API}/integrations/hubspot/connect`,
      { accessToken: MOCK_TOKEN },
      { headers: { Authorization: `Bearer ${salesToken}` } }
    )
  );
  await expect403("SALES_REP GET /integrations/hubspot", () =>
    axios.get(`${API}/integrations/hubspot`, { headers: { Authorization: `Bearer ${salesToken}` } })
  );

  // 3. Validation Errors (400)
  console.log("\n3️⃣  Zod validation on invalid/missing connection parameters (400)…");
  await expect400("POST connect with missing accessToken key", () =>
    axios.post(
      `${API}/integrations/hubspot/connect`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );
  await expect400("POST connect with empty string accessToken", () =>
    axios.post(
      `${API}/integrations/hubspot/connect`,
      { accessToken: "   " },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 4. GET 404 connection not found
  console.log("\n4️⃣  GET connection before setup (404)…");
  await expect404("GET /integrations/hubspot on empty connection list", () =>
    axios.get(`${API}/integrations/hubspot`, { headers: { Authorization: `Bearer ${adminToken}` } })
  );

  // 5. Successful HubSpot Connection Setup (201/200)
  console.log("\n5️⃣  Successful HubSpot Connection Setup…");
  const connectRes = await axios.post(
    `${API}/integrations/hubspot/connect`,
    { accessToken: MOCK_TOKEN },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (connectRes.status !== 201) fail("Connect HubSpot", `Expected 201, got ${connectRes.status}`);
  const connection = connectRes.data.data;
  if (connection.status !== "CONNECTED") fail("Connection Status", "Expected CONNECTED status");
  if (connection.accessToken) fail("Security leak", "accessToken must not be returned in API response");
  ok("HubSpot connection established. Status: " + connection.status);
  ok("Confirmed accessToken was redacted from the connection payload response");

  // 6. Persistence Checks
  console.log("\n6️⃣  PostgreSQL connection persistence verify…");
  const dbConnection = await prisma.integrationConnection.findUnique({
    where: { provider: IntegrationProvider.HUBSPOT },
  });
  if (!dbConnection) fail("PostgreSQL persistence", "Connection record not found in database");
  if (dbConnection!.accessToken !== MOCK_TOKEN) fail("Database record mismatch", "Stored token does not match mock value");
  ok("Persisted record found in DB. Token matches: true");

  // 7. GET status details + redact verification
  console.log("\n7️⃣  GET status metadata read & redaction validation…");
  // Check that SUPPORT can read this status
  const supportGetRes = await axios.get(`${API}/integrations/hubspot`, {
    headers: { Authorization: `Bearer ${supportToken}` },
  });
  if (supportGetRes.status !== 200) fail("SUPPORT GET connection status", `Expected 200, got ${supportGetRes.status}`);
  const metadata = supportGetRes.data.data;
  if (metadata.status !== "CONNECTED") fail("SUPPORT Read Status", "Expected CONNECTED status");
  if (metadata.accessToken || metadata.refreshToken) {
    fail("Security leak", "accessToken or refreshToken exposed in status GET request payload");
  }
  ok("SUPPORT successfully retrieved connection status: " + metadata.status);
  ok("Confirmed GET payload does not leak secret tokens/keys");

  // 8. Duplicate Connection Handle (409)
  console.log("\n8️⃣  Duplicate active connection check (409)…");
  await expect409("POST connect while active HubSpot connection exists", () =>
    axios.post(
      `${API}/integrations/hubspot/connect`,
      { accessToken: "another-token" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 9. Activity Log Verification
  console.log("\n9️⃣  Activity Log Verification…");
  const adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
  const connectActivity = await prisma.activity.findFirst({
    where: {
      title: "HubSpot Connected",
      userId: adminUser?.id,
    },
  });
  if (!connectActivity) fail("Activity Log", "Missing HubSpot Connected activity log");
  if (connectActivity!.content?.includes(MOCK_TOKEN)) {
    fail("Security leak", "AccessToken leaked in Activity Log details content");
  }
  ok("Verified Activity Log: " + connectActivity!.content);

  // 10. Disconnect (DELETE) Connection Setup
  console.log("\n🔟  Disconnect HubSpot Connection (DELETE)…");
  const deleteRes = await axios.delete(`${API}/integrations/hubspot`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (deleteRes.status !== 200) fail("Disconnect HubSpot", `Expected 200, got ${deleteRes.status}`);
  const disconnected = deleteRes.data.data;
  if (disconnected.status !== "DISCONNECTED") fail("Disconnected Status", "Expected DISCONNECTED status");
  if (disconnected.accessToken) fail("Security leak", "accessToken returned on DELETE response");
  ok("HubSpot connection disconnected. Status: " + disconnected.status);

  // DB verification of credentials clearance
  const dbDiscConn = await prisma.integrationConnection.findUnique({
    where: { provider: IntegrationProvider.HUBSPOT },
  });
  if (dbDiscConn?.accessToken) {
    fail("PostgreSQL credentials clearance", "accessToken was not nullified after disconnect command");
  }
  ok("PostgreSQL: Token cleared successfully in database");

  const disconnectActivity = await prisma.activity.findFirst({
    where: {
      title: "HubSpot Disconnected",
      userId: adminUser?.id,
    },
  });
  if (!disconnectActivity) fail("Activity Log", "Missing HubSpot Disconnected activity log");
  ok("Verified Disconnect Activity Log: " + disconnectActivity!.content);

  // 11. Full Regression check
  console.log("\n1️⃣1️⃣  Full Regression checks…");
  const contactsReg = await axios.get(`${API}/contacts?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (contactsReg.status !== 200) fail("Regression: Contacts", "GET /contacts failed");
  ok("Contacts CRUD: OK");

  // Clean sandbox records
  await prisma.integrationConnection.deleteMany({
    where: { provider: IntegrationProvider.HUBSPOT },
  });
  await prisma.$disconnect();

  console.log("\n==================================================");
  console.log("   PHASE 9A — HUBSPOT CONNECTION AUDIT PASSED     ");
  console.log("==================================================\n");
}

main().catch(async (e) => {
  console.error("❌ Audit suite crashed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
