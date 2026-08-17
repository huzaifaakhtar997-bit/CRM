/**
 * Phase 9D – HubSpot Deal Sync Integration Test Suite
 * ──────────────────────────────────────────────────────────────────────────
 * Tests deal import, export, and bidirectional synchronization workflows:
 *  - Authentication & RBAC role policies
 *  - Disconnected integration connection errors
 *  - Local Deal creation from HubSpot mock database import
 *  - Duplicate prevention via hubspotId
 *  - Deal updates on re-import when HubSpot data changes
 *  - Export creates HubSpot deal and stores returned ID
 *  - Re-export updates instead of creating duplicate
 *  - Bidirectional sync summary
 *  - Sync status endpoint (SUPPORT readable)
 *  - SyncLog + Activity log verification
 *  - Credentials never appear in logs or responses
 *  - Regression: Deals CRUD, Contacts sync, Companies sync all still work
 *
 * Run with:  npx ts-node run_hubspot_deal_sync_audit.ts
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
const adminEmail = `audit9d_admin_${TIMESTAMP}@crm.test`;
const salesEmail = `audit9d_sales_${TIMESTAMP}@crm.test`;
const supportEmail = `audit9d_support_${TIMESTAMP}@crm.test`;
const PASSWORD = "Audit9d!Pass";
const MOCK_TOKEN = `pat-na-hubspot-deal-sync-token-${TIMESTAMP}`;

let adminToken = "";
let salesToken = "";
let supportToken = "";
let fallbackStageId = "";

async function main() {
  console.log("\n==================================================");
  console.log("   PHASE 9D — HUBSPOT DEAL SYNC AUDIT            ");
  console.log("==================================================\n");

  // ── Clean slate ──────────────────────────────────────────────────────────────
  await prisma.integrationConnection.deleteMany({ where: { provider: IntegrationProvider.HUBSPOT } });
  await prisma.syncLog.deleteMany({});
  await prisma.deal.deleteMany({ where: { hubspotId: { not: null } } });
  hubspotClient.resetStore();

  // Make sure at least one pipeline stage exists for deal import
  const stage = await prisma.pipelineStage.findFirst({ where: { isLost: false }, orderBy: { order: "asc" } });
  if (!stage) {
    console.error("   ❌  No pipeline stages found — please seed the DB first: npx ts-node prisma/seed.ts");
    process.exit(1);
  }
  fallbackStageId = stage.id;
  ok("Pipeline stage available for import mapping", stage.name);

  // ── Bootstrap ─────────────────────────────────────────────────────────────────
  console.log("\n1️⃣  Bootstrap Auth & Database Sandbox…");
  await axios.post(`${API}/auth/register`, { name: "Audit Admin 9D", email: adminEmail, password: PASSWORD, role: "ADMIN" });
  await axios.post(`${API}/auth/register`, { name: "Audit Sales 9D", email: salesEmail, password: PASSWORD, role: "SALES_REP" });
  await axios.post(`${API}/auth/register`, { name: "Audit Support 9D", email: supportEmail, password: PASSWORD, role: "SUPPORT" });

  adminToken = (await axios.post(`${API}/auth/login`, { email: adminEmail, password: PASSWORD })).data.data.token;
  salesToken = (await axios.post(`${API}/auth/login`, { email: salesEmail, password: PASSWORD })).data.data.token;
  supportToken = (await axios.post(`${API}/auth/login`, { email: supportEmail, password: PASSWORD })).data.data.token;

  ok("Admin registered & logged in");
  ok("SALES_REP registered & logged in");
  ok("SUPPORT registered & logged in");

  // ── RBAC checks ───────────────────────────────────────────────────────────────
  console.log("\n2️⃣  RBAC checks…");
  await expect401("POST /deals/import without token", () => axios.post(`${API}/integrations/hubspot/deals/import`, {}));
  await expect403("SALES_REP POST /deals/import", () =>
    axios.post(`${API}/integrations/hubspot/deals/import`, {}, { headers: { Authorization: `Bearer ${salesToken}` } })
  );
  await expect403("SALES_REP POST /deals/export", () =>
    axios.post(`${API}/integrations/hubspot/deals/export`, {}, { headers: { Authorization: `Bearer ${salesToken}` } })
  );
  await expect403("SALES_REP POST /deals/sync", () =>
    axios.post(`${API}/integrations/hubspot/deals/sync`, {}, { headers: { Authorization: `Bearer ${salesToken}` } })
  );
  await expect403("SUPPORT POST /deals/import", () =>
    axios.post(`${API}/integrations/hubspot/deals/import`, {}, { headers: { Authorization: `Bearer ${supportToken}` } })
  );
  await expect403("SUPPORT POST /deals/export", () =>
    axios.post(`${API}/integrations/hubspot/deals/export`, {}, { headers: { Authorization: `Bearer ${supportToken}` } })
  );

  // ── No connection check ───────────────────────────────────────────────────────
  console.log("\n3️⃣  No HubSpot connection → 404…");
  await expect404("POST /deals/import with no connection", () =>
    axios.post(`${API}/integrations/hubspot/deals/import`, {}, { headers: { Authorization: `Bearer ${adminToken}` } })
  );

  // ── Establish connection ──────────────────────────────────────────────────────
  const connRes = await axios.post(
    `${API}/integrations/hubspot/connect`,
    { accessToken: MOCK_TOKEN },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (connRes.status !== 200 && connRes.status !== 201) fail("Connection", `Expected 200/201, got ${connRes.status}`);
  ok("Established HubSpot integration connection");

  // ── Import deals ──────────────────────────────────────────────────────────────
  console.log("\n4️⃣  Import HubSpot Deals (POST /deals/import)…");
  // Mock store has 1 default deal: hs-d-1001
  const importRes = await axios.post(
    `${API}/integrations/hubspot/deals/import`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (importRes.status !== 200) fail("Import request", `Expected 200, got ${importRes.status}`);
  ok("Import returned summary", importRes.data.data);
  if (importRes.data.data.created < 1) fail("Import create count", "Expected at least 1 deal created");

  // Verify deal persisted with hubspotId
  const importedDeal = await prisma.deal.findUnique({ where: { hubspotId: "hs-d-1001" } });
  if (!importedDeal) fail("Deal persistence", "Deal hs-d-1001 not found in local DB");
  ok("Deal persisted with hubspotId", importedDeal!.hubspotId);
  ok("Deal title", importedDeal!.title);
  ok("Deal value", importedDeal!.value);

  // ── Re-import duplicate check ─────────────────────────────────────────────────
  console.log("\n5️⃣  Re-import duplicate safeguard…");
  const reimportRes = await axios.post(
    `${API}/integrations/hubspot/deals/import`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (reimportRes.status !== 200) fail("Re-import request", `Expected 200, got ${reimportRes.status}`);
  if (reimportRes.data.data.created !== 0) fail("Duplicate prevention", `Re-import created ${reimportRes.data.data.created} deals instead of 0`);
  ok("Re-import did not create duplicates. Created:", reimportRes.data.data.created);

  // ── Re-import updates changed fields ─────────────────────────────────────────
  console.log("\n6️⃣  Re-import updates modified deal fields…");
  const store = (hubspotClient as any).readStore();
  store.deals["hs-d-1001"].properties.dealname = "HubSpot Mock Deal — Updated";
  store.deals["hs-d-1001"].properties.amount = "99999";
  (hubspotClient as any).writeStore(store);

  const updateImportRes = await axios.post(
    `${API}/integrations/hubspot/deals/import`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (updateImportRes.status !== 200) fail("Update import", `Expected 200, got ${updateImportRes.status}`);
  if (updateImportRes.data.data.updated !== 1) fail("Update import count", `Expected 1 updated, got ${updateImportRes.data.data.updated}`);

  const updatedDeal = await prisma.deal.findUnique({ where: { hubspotId: "hs-d-1001" } });
  if (updatedDeal?.title !== "HubSpot Mock Deal — Updated") fail("Update persistence", `Title is "${updatedDeal?.title}" not "HubSpot Mock Deal — Updated"`);
  ok("Re-import updated deal title", updatedDeal!.title);
  ok("Re-import updated deal value", updatedDeal!.value);

  // ── Export deals ──────────────────────────────────────────────────────────────
  console.log("\n7️⃣  Export CRM Deals (POST /deals/export)…");
  // Create a local deal without hubspotId
  const localDeal = await prisma.deal.create({
    data: {
      title: "Audit Export Deal",
      value: 5000,
      expectedCloseDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      stageId: fallbackStageId,
    },
  });
  ok("Created local deal without hubspotId. ID", localDeal.id);

  const exportRes = await axios.post(
    `${API}/integrations/hubspot/deals/export`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (exportRes.status !== 200) fail("Export request", `Expected 200, got ${exportRes.status}`);
  ok("Export completed. Summary:", exportRes.data.data);

  // Verify hubspotId was stored back on local deal
  const exportedDeal = await prisma.deal.findUnique({ where: { id: localDeal.id } });
  if (!exportedDeal?.hubspotId) fail("Export hubspotId storage", "Exported deal did not receive hubspotId from HubSpot mock");
  ok("Local deal received hubspotId from HubSpot", exportedDeal!.hubspotId);

  // ── Re-export duplicate check ─────────────────────────────────────────────────
  console.log("\n8️⃣  Re-export duplicate check…");
  const reexportRes = await axios.post(
    `${API}/integrations/hubspot/deals/export`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (reexportRes.status !== 200) fail("Re-export request", `Expected 200, got ${reexportRes.status}`);
  if (reexportRes.data.data.created !== 0) fail("Re-export duplicate", `Expected 0 HubSpot creates, got ${reexportRes.data.data.created}`);
  ok("Re-export updated HubSpot deals, no duplicates created");

  // ── Bidirectional sync ────────────────────────────────────────────────────────
  console.log("\n9️⃣  Bidirectional Sync (POST /deals/sync)…");
  const syncRes = await axios.post(
    `${API}/integrations/hubspot/deals/sync`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (syncRes.status !== 200) fail("Sync request", `Expected 200, got ${syncRes.status}`);
  ok("Sync completed. Summary:", syncRes.data.data);

  // ── Sync status ───────────────────────────────────────────────────────────────
  console.log("\n🔟  GET /deals/sync-status (SUPPORT token)…");
  const statusRes = await axios.get(
    `${API}/integrations/hubspot/deals/sync-status`,
    { headers: { Authorization: `Bearer ${supportToken}` } }
  );
  if (statusRes.status !== 200) fail("Sync status request", `Expected 200, got ${statusRes.status}`);
  ok("Sync status retrieved. HubSpot status:", statusRes.data.data.status);
  ok("Latest log message:", statusRes.data.data.latestLog?.message);

  // ── SyncLog verification ──────────────────────────────────────────────────────
  console.log("\n1️⃣1️⃣  SyncLog verification…");
  const syncLogs = await prisma.syncLog.findMany({ where: { entityType: "deal" } });
  if (syncLogs.length === 0) fail("SyncLog persistence", "No deal SyncLog records found");
  ok(`Deal SyncLogs created: ${syncLogs.length}`);

  // ── Activity log verification ─────────────────────────────────────────────────
  const activityLogs = await prisma.activity.findMany({ where: { title: { startsWith: "HubSpot Deal" } } });
  if (activityLogs.length === 0) fail("Activity logs", "No HubSpot Deal activity records found");
  ok(`HubSpot Deal Activity logs created: ${activityLogs.length}`);

  // ── Credentials leakage check ─────────────────────────────────────────────────
  console.log("\n1️⃣2️⃣  Credentials leakage check…");
  for (const log of syncLogs) {
    if (log.message?.includes(MOCK_TOKEN)) fail("Credentials in SyncLog", log.message ?? "");
  }
  for (const act of activityLogs) {
    if (act.content?.includes(MOCK_TOKEN)) fail("Credentials in Activity", act.content ?? "");
  }
  // Verify API responses don't expose token
  const statusData = JSON.stringify(statusRes.data);
  if (statusData.includes(MOCK_TOKEN)) fail("Credentials in response", "Token found in sync-status response");
  ok("Credentials never appear in SyncLogs, Activity logs, or responses");

  // ── Regression checks ─────────────────────────────────────────────────────────
  console.log("\n1️⃣3️⃣  Regression checks…");

  const dealsRes = await axios.get(`${API}/deals`, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (dealsRes.status !== 200) fail("Regression: Deals CRUD", "GET /deals failed");
  ok("Deals CRUD: OK");

  const contactSyncRes = await axios.get(
    `${API}/integrations/hubspot/contacts/sync-status`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (contactSyncRes.status !== 200) fail("Regression: Contact Sync Status", "GET failed");
  ok("Contacts HubSpot sync: OK");

  const companySyncRes = await axios.get(
    `${API}/integrations/hubspot/companies/sync-status`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (companySyncRes.status !== 200) fail("Regression: Company Sync Status", "GET failed");
  ok("Companies HubSpot sync: OK");

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  await prisma.syncLog.deleteMany({});
  await prisma.integrationConnection.deleteMany({ where: { provider: IntegrationProvider.HUBSPOT } });
  await prisma.deal.deleteMany({ where: { hubspotId: { not: null } } });
  await prisma.deal.deleteMany({ where: { title: "Audit Export Deal" } });
  hubspotClient.resetStore();

  await prisma.$disconnect();

  console.log("\n==================================================");
  console.log("   PHASE 9D — HUBSPOT DEAL SYNC AUDIT PASSED     ");
  console.log("==================================================\n");
}

main().catch(async (e) => {
  console.error("❌  Audit suite crashed:", e?.response?.data ?? e.message ?? e);
  await prisma.$disconnect();
  process.exit(1);
});
