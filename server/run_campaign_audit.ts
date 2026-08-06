/**
 * Phase 8A – Campaign CRUD Integration Test Suite
 * ──────────────────────────────────────────────────────────────────────────
 * Tests every endpoint, RBAC rule, search/filter/pagination behaviour,
 * activity-log persistence, and a full regression pass of previous modules.
 *
 * Run with:  npx ts-node run_campaign_audit.ts
 */

import axios, { AxiosError } from "axios";
import { PrismaClient } from "@prisma/client";

const API = "http://localhost:5000/api/v1";
const prisma = new PrismaClient();

// ── helpers ────────────────────────────────────────────────────────────────

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

// ── test data ──────────────────────────────────────────────────────────────

const TIMESTAMP = Date.now();
const adminEmail = `audit8a_admin_${TIMESTAMP}@crm.test`;
const salesEmail = `audit8a_sales_${TIMESTAMP}@crm.test`;
const PASSWORD = "Audit8a!Pass";

let adminToken = "";
let salesToken = "";
let campaignId = "";
let secondCampaignId = "";

// ══════════════════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("\n==================================================");
  console.log("   PHASE 8A — CAMPAIGN CRUD AUDIT SUITE         ");
  console.log("==================================================\n");

  // ── 1. Auth bootstrap ──────────────────────────────────────────────────
  console.log("1️⃣  Bootstrap Auth…");

  await axios.post(`${API}/auth/register`, {
    name: "Audit Admin 8A",
    email: adminEmail,
    password: PASSWORD,
    role: "ADMIN",
  });

  await axios.post(`${API}/auth/register`, {
    name: "Audit Sales 8A",
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

  // ── 2. RBAC: missing JWT → 401 ─────────────────────────────────────────
  console.log("\n2️⃣  RBAC — Missing JWT → 401…");
  await expect401("GET /campaigns without token", () =>
    axios.get(`${API}/campaigns`)
  );
  await expect401("POST /campaigns without token", () =>
    axios.post(`${API}/campaigns`, { name: "NoAuth" })
  );

  // ── 3. RBAC: SALES_REP → 403 on writes ────────────────────────────────
  console.log("\n3️⃣  RBAC — SALES_REP write attempts → 403…");
  await expect403("SALES_REP POST /campaigns", () =>
    axios.post(
      `${API}/campaigns`,
      { name: "SALES attempt" },
      { headers: { Authorization: `Bearer ${salesToken}` } }
    )
  );

  // ── 4. 404 on invalid campaign ID ─────────────────────────────────────
  console.log("\n4️⃣  404 on invalid Campaign ID…");
  await expect404("GET /campaigns/nonexistent-id", () =>
    axios.get(`${API}/campaigns/nonexistent-id-xyz`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
  );

  // ── 5. Create Campaign → 201 ───────────────────────────────────────────
  console.log("\n5️⃣  Create Campaign → 201…");
  const createRes = await axios.post(
    `${API}/campaigns`,
    {
      name: `Spring Promotion ${TIMESTAMP}`,
      subject: "Big Spring Sale",
      objective: "Drive Q2 revenue",
      content: "Hello {{name}}, check out our spring deals!",
      previewText: "Limited time offer",
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  if (createRes.status !== 201) fail("Create campaign", `Expected 201, got ${createRes.status}`);
  campaignId = createRes.data.data.campaign.id;
  const createdStatus = createRes.data.data.campaign.status;
  if (createdStatus !== "DRAFT") fail("Default status", `Expected DRAFT, got ${createdStatus}`);
  ok("Campaign created. ID: " + campaignId);
  ok("Default status is DRAFT");

  // ── 6. 409 duplicate name ──────────────────────────────────────────────
  console.log("\n6️⃣  Duplicate campaign name → 409…");
  await expect409("Duplicate campaign name", () =>
    axios.post(
      `${API}/campaigns`,
      { name: `Spring Promotion ${TIMESTAMP}` },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // ── 7. Get Campaign by ID → 200 ────────────────────────────────────────
  console.log("\n7️⃣  Get Campaign by ID → 200…");
  const getRes = await axios.get(`${API}/campaigns/${campaignId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (getRes.status !== 200) fail("Get by ID", `Expected 200, got ${getRes.status}`);
  ok("Get by ID succeeded. Name: " + getRes.data.data.campaign.name);

  // ── 8. Create second campaign for list/filter tests ────────────────────
  console.log("\n8️⃣  Create second campaign for list/search/filter tests…");
  const createRes2 = await axios.post(
    `${API}/campaigns`,
    {
      name: `Winter Newsletter ${TIMESTAMP}`,
      subject: "Winter Updates",
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  secondCampaignId = createRes2.data.data.campaign.id;
  ok("Second campaign created. ID: " + secondCampaignId);

  // ── 9. List Campaigns with pagination → 200 ────────────────────────────
  console.log("\n9️⃣  List Campaigns with pagination → 200…");
  const listRes = await axios.get(`${API}/campaigns?page=1&limit=10`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (listRes.status !== 200) fail("List campaigns", `Expected 200, got ${listRes.status}`);
  const listData = listRes.data.data;
  if (!("campaigns" in listData)) fail("List shape", "Missing 'campaigns' key");
  if (!("total" in listData)) fail("List shape", "Missing 'total' key");
  if (!("totalPages" in listData)) fail("List shape", "Missing 'totalPages' key");
  ok(`Listed campaigns. Total: ${listData.total}, Pages: ${listData.totalPages}`);

  // ── 10. Search by name ─────────────────────────────────────────────────
  console.log("\n🔟  Search by name → 200…");
  const searchRes = await axios.get(`${API}/campaigns?search=Spring+Promotion`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const searchData = searchRes.data.data;
  const springFound = searchData.campaigns.some((c: { name: string }) =>
    c.name.toLowerCase().includes("spring promotion")
  );
  if (!springFound) fail("Search by name", "Spring Promotion campaign not found in results");
  ok("Search by name returned correct campaign");

  // ── 11. Search by subject ──────────────────────────────────────────────
  console.log("\n1️⃣1️⃣  Search by subject → 200…");
  const subjectSearchRes = await axios.get(`${API}/campaigns?search=Winter+Updates`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const winterFound = subjectSearchRes.data.data.campaigns.some((c: { name: string }) =>
    c.name.toLowerCase().includes("winter")
  );
  if (!winterFound) fail("Search by subject", "Winter Newsletter not found by subject search");
  ok("Search by subject returned correct campaign");

  // ── 12. Filter by status ───────────────────────────────────────────────
  console.log("\n1️⃣2️⃣  Filter by status=DRAFT → 200…");
  const filterRes = await axios.get(`${API}/campaigns?status=DRAFT`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const filterData = filterRes.data.data;
  const allDraft = filterData.campaigns.every(
    (c: { status: string }) => c.status === "DRAFT"
  );
  if (!allDraft) fail("Status filter", "Non-DRAFT campaign found in DRAFT filter results");
  ok(`Filter by DRAFT returned ${filterData.campaigns.length} campaigns, all DRAFT`);

  // ── 13. Update Campaign → 200 ──────────────────────────────────────────
  console.log("\n1️⃣3️⃣  Update Campaign → 200…");
  const updateRes = await axios.patch(
    `${API}/campaigns/${campaignId}`,
    {
      subject: "Updated Subject Line",
      status: "SCHEDULED",
      scheduledAt: new Date(Date.now() + 86400000).toISOString(), // +1 day
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (updateRes.status !== 200) fail("Update campaign", `Expected 200, got ${updateRes.status}`);
  const updatedStatus = updateRes.data.data.campaign.status;
  const updatedSubject = updateRes.data.data.campaign.subject;
  if (updatedStatus !== "SCHEDULED") fail("Status after update", `Expected SCHEDULED, got ${updatedStatus}`);
  if (updatedSubject !== "Updated Subject Line") fail("Subject after update", "Subject not updated");
  ok("Campaign updated. Status: SCHEDULED, Subject updated");

  // ── 14. PostgreSQL Verification ────────────────────────────────────────
  console.log("\n1️⃣4️⃣  PostgreSQL Verification…");
  const dbCampaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!dbCampaign) fail("DB campaign", "Campaign not found in PostgreSQL");
  const verifiedCampaign = dbCampaign!;
  if (verifiedCampaign.status !== "SCHEDULED") fail("DB status", `Expected SCHEDULED, got ${verifiedCampaign.status}`);
  ok("Campaign persisted in PostgreSQL with correct status");
  ok("ownerId stored: " + verifiedCampaign.ownerId);
  ok("updatedAt after update: " + verifiedCampaign.updatedAt.toISOString());

  // ── 15. Activity Log Verification ─────────────────────────────────────
  console.log("\n1️⃣5️⃣  Activity Log Verification…");
  const activities = await prisma.activity.findMany({
    where: {
      metadata: {
        path: ["campaignId"],
        equals: campaignId,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const createdAct = activities.find((a) => a.title === "Campaign Created");
  const updatedAct = activities.find((a) => a.title === "Campaign Updated");

  if (!createdAct) fail("Activity log", "Missing 'Campaign Created' activity");
  ok("Activity: Campaign Created logged");

  if (!updatedAct) fail("Activity log", "Missing 'Campaign Updated' activity");
  ok("Activity: Campaign Updated logged");

  // ── 16. Delete Campaign → 200 ─────────────────────────────────────────
  console.log("\n1️⃣6️⃣  Delete Campaign → 200…");
  const deleteRes = await axios.delete(`${API}/campaigns/${campaignId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (deleteRes.status !== 200) fail("Delete campaign", `Expected 200, got ${deleteRes.status}`);
  ok("Campaign deleted. Response ID: " + deleteRes.data.data.id);

  // ── 17. Confirm deleted campaign is gone ──────────────────────────────
  console.log("\n1️⃣7️⃣  Confirm deleted Campaign returns 404…");
  await expect404("GET deleted campaign", () =>
    axios.get(`${API}/campaigns/${campaignId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
  );

  // ── 18. Activity log for delete ────────────────────────────────────────
  console.log("\n1️⃣8️⃣  Activity log — Campaign Deleted…");
  const deleteActivities = await prisma.activity.findMany({
    where: {
      title: "Campaign Deleted",
      metadata: {
        path: ["campaignId"],
        equals: campaignId,
      },
    },
  });
  if (deleteActivities.length === 0) fail("Activity log", "Missing 'Campaign Deleted' activity");
  ok("Activity: Campaign Deleted logged");

  // ── 19. PostgreSQL — record removed ────────────────────────────────────
  console.log("\n1️⃣9️⃣  PostgreSQL — record removed after delete…");
  const dbGone = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (dbGone !== null) fail("DB delete", "Campaign still present in PostgreSQL after delete");
  ok("Campaign successfully removed from PostgreSQL");

  // ── 20. Regression: Previous modules still work ────────────────────────
  console.log("\n2️⃣0️⃣  Full Regression — Previous Modules…");
  const regRes = await axios.get(`${API}/contacts?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (regRes.status !== 200) fail("Contacts regression", "GET /contacts failed");
  ok("Contacts: OK");

  const compRegRes = await axios.get(`${API}/companies?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (compRegRes.status !== 200) fail("Companies regression", "GET /companies failed");
  ok("Companies: OK");

  const leadsRegRes = await axios.get(`${API}/leads?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (leadsRegRes.status !== 200) fail("Leads regression", "GET /leads failed");
  ok("Leads: OK");

  const dealsRegRes = await axios.get(`${API}/deals?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (dealsRegRes.status !== 200) fail("Deals regression", "GET /deals failed");
  ok("Deals: OK");

  const tasksRegRes = await axios.get(`${API}/tasks?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (tasksRegRes.status !== 200) fail("Tasks regression", "GET /tasks failed");
  ok("Tasks: OK");

  const convRegRes = await axios.get(`${API}/conversations?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (convRegRes.status !== 200) fail("Conversations regression", "GET /conversations failed");
  ok("Conversations: OK");

  const templatesRegRes = await axios.get(`${API}/templates?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (templatesRegRes.status !== 200) fail("Templates regression", "GET /templates failed");
  ok("Templates: OK");

  // ── Cleanup ────────────────────────────────────────────────────────────
  await prisma.campaign.deleteMany({ where: { id: secondCampaignId } });

  await prisma.$disconnect();

  console.log("\n==================================================");
  console.log("   PHASE 8A — CAMPAIGN CRUD AUDIT SUITE PASSED  ");
  console.log("==================================================\n");
}

main().catch(async (e) => {
  console.error("❌ Audit suite crashed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
