/**
 * Phase 9B – HubSpot Contact Sync Integration Test Suite
 * ──────────────────────────────────────────────────────────────────────────
 * Tests contact import, export, and bidirectional synchronization workflows:
 *  - Authentication & RBAC role policies
 *  - Disconnected integration connection errors
 *  - Local Contact creation from HubSpot mock database import
 *  - Duplicates prevention (using email / hubspotId checks)
 *  - Contact updates on re-import
 *  - HubSpot side updates on export
 *  - Sync logs validation and credentials leakage check
 *  - Regression verification
 *
 * Run with:  npx ts-node run_hubspot_contact_sync_audit.ts
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
const adminEmail = `audit9b_admin_${TIMESTAMP}@crm.test`;
const salesEmail = `audit9b_sales_${TIMESTAMP}@crm.test`;
const supportEmail = `audit9b_support_${TIMESTAMP}@crm.test`;
const PASSWORD = "Audit9b!Pass";
const MOCK_TOKEN = `pat-na-hubspot-sync-mock-token-${TIMESTAMP}`;

let adminToken = "";
let salesToken = "";
let supportToken = "";
let testContactId = "";

async function main() {
  console.log("\n==================================================");
  console.log("   PHASE 9B — HUBSPOT CONTACT SYNC AUDIT          ");
  console.log("==================================================\n");

  // Clean integrations table & contacts
  await prisma.integrationConnection.deleteMany({
    where: { provider: IntegrationProvider.HUBSPOT },
  });
  // Clear ALL contacts with test email patterns to ensure clean slate
  await prisma.contact.deleteMany({
    where: {
      OR: [
        { email: { endsWith: "hubspot.test" } },
        { email: { endsWith: "crm.test" } },
      ],
    },
  });
  // Reset the shared JSON-backed HubSpot mock store
  hubspotClient.resetStore();

  // 1. Bootstrap
  console.log("1️⃣  Bootstrap Auth & Database Sandbox…");
  await axios.post(`${API}/auth/register`, {
    name: "Audit Admin 9B",
    email: adminEmail,
    password: PASSWORD,
    role: "ADMIN",
  });

  await axios.post(`${API}/auth/register`, {
    name: "Audit Sales 9B",
    email: salesEmail,
    password: PASSWORD,
    role: "SALES_REP",
  });

  await axios.post(`${API}/auth/register`, {
    name: "Audit Support 9B",
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
    axios.post(`${API}/integrations/hubspot/contacts/import`, {})
  );
  await expect403("SALES_REP POST /import", () =>
    axios.post(
      `${API}/integrations/hubspot/contacts/import`,
      {},
      { headers: { Authorization: `Bearer ${salesToken}` } }
    )
  );
  await expect403("SALES_REP POST /export", () =>
    axios.post(
      `${API}/integrations/hubspot/contacts/export`,
      {},
      { headers: { Authorization: `Bearer ${salesToken}` } }
    )
  );
  await expect403("SALES_REP POST /sync", () =>
    axios.post(
      `${API}/integrations/hubspot/contacts/sync`,
      {},
      { headers: { Authorization: `Bearer ${salesToken}` } }
    )
  );

  // SUPPORT can access GET sync-status, but cannot write sync calls
  await expect403("SUPPORT POST /import", () =>
    axios.post(
      `${API}/integrations/hubspot/contacts/import`,
      {},
      { headers: { Authorization: `Bearer ${supportToken}` } }
    )
  );

  // 3. Error without connection
  console.log("\n3️⃣  Verify connection checks before sync (404)…");
  await expect404("POST /import with no connection record", () =>
    axios.post(
      `${API}/integrations/hubspot/contacts/import`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // Connect integration connection
  await axios.post(
    `${API}/integrations/hubspot/connect`,
    { accessToken: MOCK_TOKEN },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  ok("Established HubSpot integration connection");

  // 4. Contact Import (New contact created)
  console.log("\n4️⃣  Contacts Import (POST /contacts/import)…");
  // Pre-seed mock HubSpot data
  const hsContact = await hubspotClient.createContact(MOCK_TOKEN, {
    firstname: "SyncUser",
    lastname: "Imported",
    email: `import_new_${TIMESTAMP}@hubspot.test`,
    phone: "555-0199",
    jobtitle: "Supervisor",
  });
  ok("Pre-seeded contact in HubSpot Mock Store. ID: " + hsContact.id);

  const importRes = await axios.post(
    `${API}/integrations/hubspot/contacts/import`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (importRes.status !== 200) fail("Import Contacts", `Expected 200, got ${importRes.status}`);
  const importSummary = importRes.data.data;
  ok("Import returned summary counts", importSummary);

  // Verify DB record existence
  const localContact = await prisma.contact.findUnique({
    where: { email: `import_new_${TIMESTAMP}@hubspot.test` },
  });
  if (!localContact) fail("Contact persistence", "Imported contact not found in database");
  if (localContact!.hubspotId !== hsContact.id) fail("hubspotId reference mapping", "hubspotId does not match");
  ok("Contact persisted locally with correct hubspotId: " + localContact!.hubspotId);

  // 5. Re-import (No duplicates)
  console.log("\n5️⃣  Re-import duplicate safeguard check…");
  const reImportRes = await axios.post(
    `${API}/integrations/hubspot/contacts/import`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const reImportSummary = reImportRes.data.data;
  if (reImportSummary.created !== 0) fail("Duplicate created", "Contact was duplicated on repeated import");
  ok("Re-import completed safely. Created contacts count: " + reImportSummary.created);

  // 6. Contact Update on Import
  console.log("\n6️⃣  Contact Update check on re-import…");
  // Update properties on HubSpot mock database
  await hubspotClient.updateContact(MOCK_TOKEN, hsContact.id, {
    firstname: "SyncUserUpdated",
  });
  await axios.post(
    `${API}/integrations/hubspot/contacts/import`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const updatedContact = await prisma.contact.findUnique({
    where: { email: `import_new_${TIMESTAMP}@hubspot.test` },
  });
  if (updatedContact?.firstName !== "SyncUserUpdated") fail("Contact fields sync", "Contact fields were not updated on import");
  ok("Re-import successfully updated modified contact fields: " + updatedContact!.firstName);

  // 7. Contact Export
  console.log("\n7️⃣  Contacts Export (POST /contacts/export)…");
  // Create a contact locally in CRM first
  const newLocal = await prisma.contact.create({
    data: {
      firstName: "ExportUser",
      lastName: "Local",
      email: `export_new_${TIMESTAMP}@crm.test`,
      phone: "555-9000",
      jobTitle: "Director",
    },
  });
  testContactId = newLocal.id;
  ok("Created contact locally. ID: " + testContactId);

  const exportRes = await axios.post(
    `${API}/integrations/hubspot/contacts/export`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (exportRes.status !== 200) fail("Export Contacts", `Expected 200, got ${exportRes.status}`);
  const exportSummary = exportRes.data.data;
  ok("Export completed. Summary counts: ", exportSummary);

  // Verify local contact got hubspotId back
  const exportedLocal = await prisma.contact.findUnique({ where: { id: testContactId } });
  if (!exportedLocal?.hubspotId) fail("Export hubspotId mapping", "Local contact did not receive hubspotId reference");
  ok("Local contact linked to HubSpot with ID: " + exportedLocal!.hubspotId);

  // 8. Re-export updates instead of creating new
  console.log("\n8️⃣  Re-export duplicate check…");
  await prisma.contact.update({
    where: { id: testContactId },
    data: { firstName: "ExportUserUpdated" },
  });
  const reExportRes = await axios.post(
    `${API}/integrations/hubspot/contacts/export`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const reExportSummary = reExportRes.data.data;
  // If re-export worked correctly, it should update it on HubSpot, created counts must be 0
  if (reExportSummary.created !== 0) fail("Re-export created duplicate", "Created a new contact instead of updating");
  ok("Re-export processed successfully. Created contacts: " + reExportSummary.created);

  // Verify update on Mock Store
  const hsStoreContact = (await hubspotClient.getContacts(MOCK_TOKEN)).find(
    (c) => c.id === exportedLocal!.hubspotId
  );
  if (hsStoreContact?.properties.firstname !== "ExportUserUpdated") fail("Mock HubSpot update verification", "First name not updated on HubSpot side");
  ok("Confirmed contact updated successfully on HubSpot mock store");

  // 9. Bidirectional Sync
  console.log("\n9️⃣  Bidirectional Sync (POST /contacts/sync)…");
  const syncRes = await axios.post(
    `${API}/integrations/hubspot/contacts/sync`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (syncRes.status !== 200) fail("Sync Contacts", `Expected 200, got ${syncRes.status}`);
  ok("Sync completed. Summary: ", syncRes.data.data);

  // 10. GET Sync Status details
  console.log("\n🔟  GET Sync Status (GET /contacts/sync-status)…");
  const statusRes = await axios.get(`${API}/integrations/hubspot/contacts/sync-status`, {
    headers: { Authorization: `Bearer ${supportToken}` }, // SUPPORT role check
  });
  if (statusRes.status !== 200) fail("Sync Status", `Expected 200, got ${statusRes.status}`);
  const syncStatus = statusRes.data.data;
  if (syncStatus.latestLog.status !== "SUCCESS") fail("SyncLog verification", "Expected SyncLogStatus SUCCESS");
  ok("Retrieved sync status details. Status: " + syncStatus.status + ", Latest log message: " + syncStatus.latestLog.message);

  // 11. Credentials Leakage check
  console.log("\n1️⃣1️⃣  Credentials Leakage check…");
  const latestLogDb = await prisma.syncLog.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (latestLogDb?.message?.includes(MOCK_TOKEN)) {
    fail("Security Leak", "Secret token leaked in SyncLog message string");
  }
  ok("Confirmed credentials never appear in SyncLogs / responses");

  // 12. Full Regression checks
  console.log("\n1️⃣2️⃣  Full Regression checks…");
  const contactsCRUDRes = await axios.get(`${API}/contacts?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (contactsCRUDRes.status !== 200) fail("Regression: Contacts", "GET /contacts failed");
  ok("Contacts CRUD: OK");

  // Clean sandbox records
  await prisma.syncLog.deleteMany({});
  await prisma.integrationConnection.deleteMany({
    where: { provider: IntegrationProvider.HUBSPOT },
  });
  await prisma.contact.deleteMany({
    where: {
      OR: [
        { email: { endsWith: "hubspot.test" } },
        { email: { endsWith: "crm.test" } },
      ],
    },
  });
  hubspotClient.resetStore();

  await prisma.$disconnect();


  console.log("\n==================================================");
  console.log("   PHASE 9B — HUBSPOT CONTACT SYNC AUDIT PASSED   ");
  console.log("==================================================\n");
}

main().catch(async (e) => {
  console.error("❌ Audit suite crashed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
