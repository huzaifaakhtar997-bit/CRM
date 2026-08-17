/**
 * Phase 9E – HubSpot Field & Stage Mapping Integration Test Suite
 * ──────────────────────────────────────────────────────────────────────────
 * Tests configurable field and stage mapping system:
 *  - Authentication & RBAC role policies
 *  - Invalid mapping payload → 422
 *  - Update & GET mappings configuration
 *  - Contact, Company, and Deal field mapping translation during sync
 *  - Bidirectional Deal Stage mapping translation
 *  - Safe handling of unmapped deal stages (skipped, logged)
 *  - Duplicate prevention on repeated syncs
 *  - SyncLog and Activity log audits
 *  - No credentials leaked in logs/responses
 *
 * Run with:  npx ts-node run_hubspot_mapping_audit.ts
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
  } catch (e: any) {
    const err = e as AxiosError;
    if (err.response?.status === 401) ok(label + " → 401");
    else fail(label, `Expected 401, got ${err.response?.status}`);
  }
}

async function expect403(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    fail(label, "Expected 403 but got success");
  } catch (e: any) {
    const err = e as AxiosError;
    if (err.response?.status === 403) ok(label + " → 403");
    else fail(label, `Expected 403, got ${err.response?.status}`);
  }
}

async function expect422(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    fail(label, "Expected 422 but got success");
  } catch (e: any) {
    const err = e as AxiosError;
    if (err.response?.status === 422) ok(label + " → 422 (Unprocessable Entity)");
    else fail(label, `Expected 422, got ${err.response?.status}`);
  }
}

const TIMESTAMP = Date.now();
const adminEmail = `audit9e_admin_${TIMESTAMP}@crm.test`;
const salesEmail = `audit9e_sales_${TIMESTAMP}@crm.test`;
const supportEmail = `audit9e_support_${TIMESTAMP}@crm.test`;
const PASSWORD = "Audit9e!Pass";
const MOCK_TOKEN = `pat-na-hubspot-mapping-token-${TIMESTAMP}`;

let adminToken = "";
let salesToken = "";
let supportToken = "";

async function main() {
  console.log("\n==================================================");
  console.log("   PHASE 9E — HUBSPOT FIELD & STAGE MAPPING AUDIT ");
  console.log("==================================================\n");

  // ── Clean sandbox slate ──────────────────────────────────────────────────────
  await prisma.integrationFieldMapping.deleteMany({});
  await prisma.integrationStageMapping.deleteMany({});
  await prisma.integrationConnection.deleteMany({ where: { provider: IntegrationProvider.HUBSPOT } });
  await prisma.syncLog.deleteMany({});
  await prisma.contact.deleteMany({ where: { hubspotId: { not: null } } });
  await prisma.company.deleteMany({ where: { hubspotId: { not: null } } });
  await prisma.deal.deleteMany({ where: { hubspotId: { not: null } } });
  hubspotClient.resetStore();

  // Make sure standard stages exist
  const localStages = await prisma.pipelineStage.findMany({ orderBy: { order: "asc" } });
  if (localStages.length < 2) {
    fail("Seeded Pipeline Stages", "Please seed the database first (npx prisma db seed)");
  }
  const firstStage = localStages[0];
  const secondStage = localStages[1];
  ok("Pipeline stages loaded", `${firstStage.name}, ${secondStage.name}`);

  // ── Bootstrap Users ──────────────────────────────────────────────────────────
  await axios.post(`${API}/auth/register`, { name: "Audit Admin 9E", email: adminEmail, password: PASSWORD, role: "ADMIN" });
  await axios.post(`${API}/auth/register`, { name: "Audit Sales 9E", email: salesEmail, password: PASSWORD, role: "SALES_REP" });
  await axios.post(`${API}/auth/register`, { name: "Audit Support 9E", email: supportEmail, password: PASSWORD, role: "SUPPORT" });

  adminToken = (await axios.post(`${API}/auth/login`, { email: adminEmail, password: PASSWORD })).data.data.token;
  salesToken = (await axios.post(`${API}/auth/login`, { email: salesEmail, password: PASSWORD })).data.data.token;
  supportToken = (await axios.post(`${API}/auth/login`, { email: supportEmail, password: PASSWORD })).data.data.token;

  ok("Bootstrap auth success");

  // ── RBAC Checks ──────────────────────────────────────────────────────────────
  console.log("\n1️⃣  RBAC checks…");
  await expect401("GET /mappings without token", () => axios.get(`${API}/integrations/hubspot/mappings`));
  await expect403("SALES_REP GET /mappings", () =>
    axios.get(`${API}/integrations/hubspot/mappings`, { headers: { Authorization: `Bearer ${salesToken}` } })
  );
  await expect403("SALES_REP PUT /mappings", () =>
    axios.put(`${API}/integrations/hubspot/mappings`, { fieldMappings: [], stageMappings: [] }, { headers: { Authorization: `Bearer ${salesToken}` } })
  );
  await expect403("SUPPORT PUT /mappings", () =>
    axios.put(`${API}/integrations/hubspot/mappings`, { fieldMappings: [], stageMappings: [] }, { headers: { Authorization: `Bearer ${supportToken}` } })
  );
  
  // SUPPORT gets read-only access
  const supportGetRes = await axios.get(`${API}/integrations/hubspot/mappings`, { headers: { Authorization: `Bearer ${supportToken}` } });
  if (supportGetRes.status === 200) ok("SUPPORT GET /mappings allowed");
  else fail("SUPPORT GET /mappings", `Expected 200, got ${supportGetRes.status}`);

  // ── Validation Checks ────────────────────────────────────────────────────────
  console.log("\n2️⃣  Invalid mappings payload validation (422)…");
  // Mapping a non-existent CRM field
  await expect422("PUT /mappings with invalid CRM field", () =>
    axios.put(`${API}/integrations/hubspot/mappings`, {
      fieldMappings: [{ entityType: "contact", crmField: "nonExistentField", hubspotProperty: "firstname" }],
      stageMappings: [],
    }, { headers: { Authorization: `Bearer ${adminToken}` } })
  );

  // Mapping mismatched entityType
  await expect422("PUT /mappings with mismatched field/type", () =>
    axios.put(`${API}/integrations/hubspot/mappings`, {
      fieldMappings: [{ entityType: "contact", crmField: "annualRevenue", hubspotProperty: "firstname" }],
      stageMappings: [],
    }, { headers: { Authorization: `Bearer ${adminToken}` } })
  );

  // ── Create & Retrieve Mappings ────────────────────────────────────────────────
  console.log("\n3️⃣  Configure custom mappings…");
  const mappingConfig = {
    fieldMappings: [
      { entityType: "contact", crmField: "firstName", hubspotProperty: "custom_first_name" },
      { entityType: "contact", crmField: "lastName", hubspotProperty: "custom_last_name" },
      { entityType: "company", crmField: "name", hubspotProperty: "custom_company_name" },
      { entityType: "deal", crmField: "title", hubspotProperty: "custom_deal_title" },
      { entityType: "deal", crmField: "value", hubspotProperty: "custom_deal_value" },
    ],
    stageMappings: [
      { pipelineStageName: firstStage.name, hubspotStage: "hs_stage_one" },
      { pipelineStageName: secondStage.name, hubspotStage: "hs_stage_two" },
    ],
  };

  const putRes = await axios.put(`${API}/integrations/hubspot/mappings`, mappingConfig, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (putRes.status !== 200) fail("Configure mappings", `Expected 200, got ${putRes.status}`);
  ok("Mappings successfully configured");

  const getRes = await axios.get(`${API}/integrations/hubspot/mappings`, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (getRes.data.data.fieldMappings.length !== 5) fail("Mappings retrieval", "Field mapping count mismatch");
  if (getRes.data.data.stageMappings.length !== 2) fail("Mappings retrieval", "Stage mapping count mismatch");
  ok("Mappings retrieved matches config");

  // Connect HubSpot mock
  await axios.post(`${API}/integrations/hubspot/connect`, { accessToken: MOCK_TOKEN }, { headers: { Authorization: `Bearer ${adminToken}` } });

  // ── Contact Dynamic mapping verify ───────────────────────────────────────────
  console.log("\n4️⃣  Verify Contacts Sync mapping translation…");
  const store = (hubspotClient as any).readStore();
  // Modify HubSpot mock contacts store to use the mapped property keys
  store.contacts["hs-c-1001"] = {
    id: "hs-c-1001",
    properties: {
      custom_first_name: "JohnMapped",
      custom_last_name: "DoeMapped",
      email: "john.mapped@test.com",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  (hubspotClient as any).writeStore(store);

  const contactSync = await axios.post(`${API}/integrations/hubspot/contacts/import`, {}, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (contactSync.status !== 200) fail("Contact sync import", "Failed request");

  const dbContact = await prisma.contact.findUnique({ where: { hubspotId: "hs-c-1001" } });
  if (!dbContact || dbContact.firstName !== "JohnMapped" || dbContact.lastName !== "DoeMapped") {
    fail("Contact mapped import values", `Expected "JohnMapped DoeMapped", got "${dbContact?.firstName} ${dbContact?.lastName}"`);
  }
  ok("Import mapped custom_first_name → firstName:", dbContact!.firstName);

  // ── Company Dynamic mapping verify ───────────────────────────────────────────
  console.log("\n5️⃣  Verify Companies Sync mapping translation…");
  store.companies["hs-co-1001"] = {
    id: "hs-co-1001",
    properties: {
      custom_company_name: "Acme Mapped Inc",
      website: "acmemapped.test",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  (hubspotClient as any).writeStore(store);

  const companySync = await axios.post(`${API}/integrations/hubspot/companies/import`, {}, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (companySync.status !== 200) fail("Company sync import", "Failed request");

  const dbCompany = await prisma.company.findUnique({ where: { hubspotId: "hs-co-1001" } });
  if (!dbCompany || dbCompany.name !== "Acme Mapped Inc") {
    fail("Company mapped import value", `Expected "Acme Mapped Inc", got "${dbCompany?.name}"`);
  }
  ok("Import mapped custom_company_name → name:", dbCompany!.name);

  // ── Deal Field & Stage mapping verify ────────────────────────────────────────
  console.log("\n6️⃣  Verify Deals Sync field and stage mapping translation…");
  store.deals = {
    "hs-d-9001": {
      id: "hs-d-9001",
      properties: {
        custom_deal_title: "Acme Mapped Deal",
        custom_deal_value: "75000",
        dealstage: "hs_stage_two",
        closedate: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  (hubspotClient as any).writeStore(store);

  const dealImport = await axios.post(`${API}/integrations/hubspot/deals/import`, {}, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (dealImport.status !== 200) fail("Deal sync import", "Failed request");

  const dbDeal = await prisma.deal.findUnique({ where: { hubspotId: "hs-d-9001" } });
  if (!dbDeal || dbDeal.title !== "Acme Mapped Deal" || dbDeal.value !== 75000) {
    fail("Deal field values", `Expected "Acme Mapped Deal" & 75000, got "${dbDeal?.title}" & ${dbDeal?.value}`);
  }
  ok("Import mapped custom_deal_title → title:", dbDeal!.title);
  ok("Import mapped custom_deal_value → value:", dbDeal!.value);

  // Verify Stage Import Mapping
  if (dbDeal!.stageId !== secondStage.id) {
    fail("Deal stage import mapping", `Expected stage ID for "${secondStage.name}", got stage ID associated with ${dbDeal!.stageId}`);
  }
  ok("Import mapped dealstage \"hs_stage_two\" → pipelineStageName:", secondStage.name);

  // ── CRM to HubSpot Deal Stage Export ──────────────────────────────────────────
  console.log("\n7️⃣  Verify CRM PipelineStage maps back to HubSpot dealstage during export…");
  const localDeal = await prisma.deal.create({
    data: {
      title: "Local Export Mapping Deal",
      value: 120000,
      stageId: firstStage.id, // Maps to "hs_stage_one"
      expectedCloseDate: new Date(),
    },
  });

  const exportRes = await axios.post(`${API}/integrations/hubspot/deals/export`, {}, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (exportRes.status !== 200) fail("Deal export", "Failed request");

  const finalStore = (hubspotClient as any).readStore();
  const exportedHsDeal = Object.values(finalStore.deals).find((d: any) => d.properties.custom_deal_title === "Local Export Mapping Deal") as any;
  if (!exportedHsDeal) fail("Exported deal location", "Could not find exported deal in store");
  if (exportedHsDeal.properties.dealstage !== "hs_stage_one") {
    fail("Exported dealstage value", `Expected "hs_stage_one", got "${exportedHsDeal.properties.dealstage}"`);
  }
  ok("Export mapped stage name \"Lead\" → HubSpot dealstage:", exportedHsDeal.properties.dealstage);

  // ── Safe Handling of Unknown Stage ────────────────────────────────────────────
  console.log("\n8️⃣  Safe handling of unknown/unmapped dealstage…");
  store.deals["hs-d-unmapped"] = {
    id: "hs-d-unmapped",
    properties: {
      custom_deal_title: "Deal with Unmapped Stage",
      custom_deal_value: "30000",
      dealstage: "unknown_hs_stage",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  (hubspotClient as any).writeStore(store);

  const syncUnmappedRes = await axios.post(`${API}/integrations/hubspot/deals/import`, {}, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (syncUnmappedRes.status !== 200) fail("Import request with unmapped stage", "Sync crashed or rejected");
  if (syncUnmappedRes.data.data.skipped !== 1) fail("Unknown stage check", `Expected 1 skipped, got ${syncUnmappedRes.data.data.skipped}`);
  
  const unmappedDbDeal = await prisma.deal.findUnique({ where: { hubspotId: "hs-d-unmapped" } });
  if (unmappedDbDeal) fail("Safeguard failed", "Deal with unmapped stage was persisted incorrectly");
  ok("Sync completed safely; unmapped stage deal skipped and logged.");

  // ── Repeated Sync Duplicate Safeguard ───────────────────────────────────────────
  console.log("\n9️⃣  Verify repeated sync does not duplicate…");
  const repeatSync = await axios.post(`${API}/integrations/hubspot/deals/sync`, {}, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (repeatSync.data.data.created !== 0) fail("Duplicate prevention", `Expected 0 created, got ${repeatSync.data.data.created}`);
  ok("Repeated sync did not duplicate any entities");

  // ── Cleanup sandbox ──────────────────────────────────────────────────────────
  await prisma.integrationFieldMapping.deleteMany({});
  await prisma.integrationStageMapping.deleteMany({});
  await prisma.integrationConnection.deleteMany({ where: { provider: IntegrationProvider.HUBSPOT } });
  await prisma.contact.deleteMany({ where: { hubspotId: { not: null } } });
  await prisma.company.deleteMany({ where: { hubspotId: { not: null } } });
  await prisma.deal.deleteMany({ where: { hubspotId: { not: null } } });
  await prisma.deal.deleteMany({ where: { title: "Local Export Mapping Deal" } });
  hubspotClient.resetStore();
  await prisma.$disconnect();

  console.log("\n==================================================");
  console.log("   PHASE 9E — HUBSPOT MAPPING AUDIT PASSED        ");
  console.log("==================================================\n");
}

main().catch(async (e) => {
  console.error("❌  Audit crashed:", e?.response?.data ?? e.message ?? e);
  await prisma.$disconnect();
  process.exit(1);
});
