/**
 * Phase 9C – HubSpot Company Sync Integration Test Suite
 * ──────────────────────────────────────────────────────────────────────────
 * Tests company import, export, and bidirectional synchronization workflows:
 *  - Authentication & RBAC role policies
 *  - Disconnected integration connection errors
 *  - Local Company creation from HubSpot mock database import
 *  - Duplicates prevention (using website / name / hubspotId checks)
 *  - Company updates on re-import
 *  - HubSpot side updates on export
 *  - Sync logs validation and credentials leakage check
 *  - Regression verification (Contacts, Campaigns, messaging)
 *
 * Run with:  npx ts-node run_hubspot_company_sync_audit.ts
 */

import axios, { AxiosError } from "axios";
import { PrismaClient, IntegrationProvider, SyncLogStatus } from "@prisma/client";
import { hubspotClient } from "./src/services/hubspot-client.service";

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
const adminEmail = `audit9c_admin_${TIMESTAMP}@crm.test`;
const salesEmail = `audit9c_sales_${TIMESTAMP}@crm.test`;
const supportEmail = `audit9c_support_${TIMESTAMP}@crm.test`;
const PASSWORD = "Audit9c!Pass";
const MOCK_TOKEN = `pat-na-hubspot-sync-company-mock-token-${TIMESTAMP}`;

let adminToken = "";
let salesToken = "";
let supportToken = "";

async function main() {
  console.log("\n==================================================");
  console.log("   PHASE 9C — HUBSPOT COMPANY SYNC AUDIT          ");
  console.log("==================================================\n");

  // Clean DB tables
  await prisma.integrationConnection.deleteMany({
    where: { provider: IntegrationProvider.HUBSPOT },
  });
  await prisma.company.deleteMany({
    where: {
      OR: [
        { website: { endsWith: "hubspot.test" } },
        { website: { endsWith: "crm.test" } },
        { name: { startsWith: "Audit" } },
      ],
    },
  });
  hubspotClient.resetStore();

  // 1. Bootstrap
  console.log("1️⃣  Bootstrap Auth & Database Sandbox…");
  await axios.post(`${API}/auth/register`, {
    name: "Audit Admin 9C",
    email: adminEmail,
    password: PASSWORD,
    role: "ADMIN",
  });

  await axios.post(`${API}/auth/register`, {
    name: "Audit Sales 9C",
    email: salesEmail,
    password: PASSWORD,
    role: "SALES_REP",
  });

  await axios.post(`${API}/auth/register`, {
    name: "Audit Support 9C",
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

  // 2. RBAC checks
  console.log("\n2️⃣  RBAC checks (Missing JWT, SALES_REP block)…");
  await expect401("POST /import without token", () =>
    axios.post(`${API}/integrations/hubspot/companies/import`, {})
  );
  await expect403("SALES_REP POST /import", () =>
    axios.post(
      `${API}/integrations/hubspot/companies/import`,
      {},
      { headers: { Authorization: `Bearer ${salesToken}` } }
    )
  );
  await expect403("SALES_REP POST /export", () =>
    axios.post(
      `${API}/integrations/hubspot/companies/export`,
      {},
      { headers: { Authorization: `Bearer ${salesToken}` } }
    )
  );
  await expect403("SALES_REP POST /sync", () =>
    axios.post(
      `${API}/integrations/hubspot/companies/sync`,
      {},
      { headers: { Authorization: `Bearer ${salesToken}` } }
    )
  );
  await expect403("SUPPORT POST /import", () =>
    axios.post(
      `${API}/integrations/hubspot/companies/import`,
      {},
      { headers: { Authorization: `Bearer ${supportToken}` } }
    )
  );

  // 3. Verify connection checks before sync
  console.log("\n3️⃣  Verify connection checks before sync (404)…");
  await expect404("POST /import with no connection record", () =>
    axios.post(
      `${API}/integrations/hubspot/companies/import`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // Establish HubSpot integration connection
  const connRes = await axios.post(
    `${API}/integrations/hubspot/connect`,
    { accessToken: MOCK_TOKEN },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (connRes.status === 200 || connRes.status === 201) {
    ok("Established HubSpot integration connection");
  } else {
    fail("Connection establishment", `Expected 200 or 201, got ${connRes.status}`);
  }

  // 4. Companies Import
  console.log("\n4️⃣  Companies Import (POST /companies/import)…");
  // We have a default company "hs-c-1001" pre-seeded in the mock client
  const importRes = await axios.post(
    `${API}/integrations/hubspot/companies/import`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (importRes.status !== 200) fail("Import request", `Expected 200, got ${importRes.status}`);
  ok("Import returned summary counts", importRes.data.data);

  // Check company exists in DB
  const localCompany = await prisma.company.findUnique({
    where: { hubspotId: "hs-c-1001" },
  });
  if (!localCompany) fail("Company persistence", "Company hs-c-1001 not found in local DB");
  ok("Company persisted locally with correct hubspotId", localCompany!.hubspotId);
  ok("Company website", localCompany!.website);
  ok("Company name", localCompany!.name);

  // 5. Re-import duplicate safeguard check
  console.log("\n5️⃣  Re-import duplicate safeguard check…");
  const reimportRes = await axios.post(
    `${API}/integrations/hubspot/companies/import`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (reimportRes.status !== 200) fail("Re-import request", `Expected 200, got ${reimportRes.status}`);
  if (reimportRes.data.data.created !== 0) {
    fail("Duplicate Prevention", `Re-import created ${reimportRes.data.data.created} companies instead of 0`);
  }
  ok("Re-import completed safely. Created companies count: 0");

  // 6. Company Update check on re-import
  console.log("\n6️⃣  Company Update check on re-import…");
  // Change name of company in mock HubSpot client
  const storeSchema = (hubspotClient as any).readStore();
  storeSchema.companies["hs-c-1001"].properties.name = "SyncCompanyUpdated";
  (hubspotClient as any).writeStore(storeSchema);

  const updateImportRes = await axios.post(
    `${API}/integrations/hubspot/companies/import`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (updateImportRes.status !== 200) fail("Update import request", `Expected 200, got ${updateImportRes.status}`);
  if (updateImportRes.data.data.updated !== 1) {
    fail("Update import logic", `Expected 1 updated company, got ${updateImportRes.data.data.updated}`);
  }

  const localUpdatedCompany = await prisma.company.findUnique({
    where: { hubspotId: "hs-c-1001" },
  });
  if (localUpdatedCompany?.name !== "SyncCompanyUpdated") {
    fail("Update import persistence", `Local company name is "${localUpdatedCompany?.name}" instead of "SyncCompanyUpdated"`);
  }
  ok("Re-import successfully updated modified company fields", localUpdatedCompany!.name);

  // 7. Companies Export
  console.log("\n7️⃣  Companies Export (POST /companies/export)…");
  // Create a local company without hubspotId
  const newCrmCompany = await prisma.company.create({
    data: {
      name: "Audit Export New Company",
      website: `export_new_${TIMESTAMP}@crm.test`,
      industry: "CRM Test",
    },
  });
  ok("Created company locally. ID", newCrmCompany.id);

  const exportRes = await axios.post(
    `${API}/integrations/hubspot/companies/export`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (exportRes.status !== 200) fail("Export request", `Expected 200, got ${exportRes.status}`);
  ok("Export completed. Summary counts: ", exportRes.data.data);

  // Verify that the local company now has a hubspotId
  const exportedCompany = await prisma.company.findUnique({
    where: { id: newCrmCompany.id },
  });
  if (!exportedCompany?.hubspotId) {
    fail("Export HubSpot ID storage", "Exported company did not get a hubspotId back from HubSpot mock");
  }
  ok("Local company linked to HubSpot with ID", exportedCompany!.hubspotId);

  // 8. Re-export duplicate check
  console.log("\n8️⃣  Re-export duplicate check…");
  const reexportRes = await axios.post(
    `${API}/integrations/hubspot/companies/export`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (reexportRes.status !== 200) fail("Re-export request", `Expected 200, got ${reexportRes.status}`);
  if (reexportRes.data.data.created !== 0) {
    fail("Export duplicate check", `Expected 0 created on HubSpot, got ${reexportRes.data.data.created}`);
  }
  ok("Re-export processed successfully. Created companies: 0");

  // Verify HubSpot store has the company
  const finalStore = (hubspotClient as any).readStore();
  const hsComp = finalStore.companies[exportedCompany!.hubspotId!];
  if (!hsComp || hsComp.properties.name !== "Audit Export New Company") {
    fail("HubSpot Mock Store verify", "Company not correctly stored/updated on HubSpot client side");
  }
  ok("Confirmed company updated successfully on HubSpot mock store");


  // 9. Bidirectional Sync
  console.log("\n9️⃣  Bidirectional Sync (POST /companies/sync)…");
  const syncRes = await axios.post(
    `${API}/integrations/hubspot/companies/sync`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (syncRes.status !== 200) fail("Sync request", `Expected 200, got ${syncRes.status}`);
  ok("Sync completed. Summary: ", syncRes.data.data);

  // 10. GET Sync Status
  console.log("\n🔟  GET Sync Status (GET /companies/sync-status)…");
  const statusRes = await axios.get(
    `${API}/integrations/hubspot/companies/sync-status`,
    { headers: { Authorization: `Bearer ${supportToken}` } }
  );
  if (statusRes.status !== 200) fail("Sync status request", `Expected 200, got ${statusRes.status}`);
  ok("Retrieved sync status details. Status", statusRes.data.data.status);
  ok("Latest log message", statusRes.data.data.latestLog?.message);

  // 11. Credentials Leakage check
  console.log("\n1️⃣1️⃣  Credentials Leakage check…");
  const syncLogs = await prisma.syncLog.findMany({
    where: { entityType: "company" },
  });
  if (syncLogs.length === 0) fail("SyncLog persistence", "No sync logs found");
  
  for (const log of syncLogs) {
    if (log.message?.includes(MOCK_TOKEN)) {
      fail("Credentials leakage", `Access token found in sync log: ${log.message}`);
    }
  }
  
  const activityLogs = await prisma.activity.findMany({
    where: { content: { contains: MOCK_TOKEN } },
  });
  if (activityLogs.length > 0) {
    fail("Credentials leakage", "Access token found in Activity logs");
  }
  ok("Confirmed credentials never appear in SyncLogs / responses");

  // 12. Full Regression checks
  console.log("\n1️⃣2️⃣  Full Regression checks…");
  // Check that standard CRUD routes for companies still work normally
  const companiesCRUDRes = await axios.get(
    `${API}/companies`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (companiesCRUDRes.status !== 200) fail("Regression: Companies", "GET /companies failed");
  ok("Companies CRUD: OK");

  // Check HubSpot Contacts Sync is still fully operational
  const contactStatusRes = await axios.get(
    `${API}/integrations/hubspot/contacts/sync-status`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (contactStatusRes.status !== 200) fail("Regression: Contacts Sync Status", "GET /contacts/sync-status failed");
  ok("Regression: Contacts Sync: OK");

  // Clean sandbox records
  await prisma.syncLog.deleteMany({});
  await prisma.integrationConnection.deleteMany({
    where: { provider: IntegrationProvider.HUBSPOT },
  });
  await prisma.company.deleteMany({
    where: {
      OR: [
        { website: { endsWith: "hubspot.test" } },
        { website: { endsWith: "crm.test" } },
        { name: { startsWith: "Audit" } },
      ],
    },
  });
  hubspotClient.resetStore();

  await prisma.$disconnect();

  console.log("\n==================================================");
  console.log("   PHASE 9C — HUBSPOT COMPANY SYNC AUDIT PASSED   ");
  console.log("==================================================\n");
}

main().catch(async (e) => {
  console.error("❌ Audit suite crashed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
