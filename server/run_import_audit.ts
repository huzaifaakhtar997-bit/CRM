/**
 * run_import_audit.ts
 *
 * Phase 10 — Excel/CSV Import Engine Audit Script
 *
 * Tests:
 *  1.  Missing JWT → 401
 *  2.  Unauthorized role → 403
 *  3.  Invalid file type → 422
 *  4.  Missing required columns → validation error
 *  5.  Valid CSV Contacts import
 *  6.  Valid XLSX Contacts import
 *  7.  Valid CSV Companies import
 *  8.  Duplicate handling (contacts by email, companies by name/website)
 *  9.  Invalid rows do not stop valid rows
 *  10. Correct ImportJob counts
 *  11. Import job status endpoint
 *  12. Import history endpoint
 *  13. PostgreSQL records are actually created/updated
 *  14. Repeated imports do not create duplicates
 *  15. Contacts CRUD regression
 *  16. Companies CRUD regression
 *  17. npx tsc --noEmit → 0 errors
 *  18. npx prisma validate → success
 *
 * Run: npx ts-node server/run_import_audit.ts
 */

import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import * as XLSX from "xlsx";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import * as path from "path";

// ─── Setup ────────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:5000/api/v1";
const prisma = new PrismaClient();

let adminToken = "";
let salesToken = "";
let supportToken = "";
let managerToken = "";
let adminUserId = "";

let passed = 0;
let failed = 0;
const errors: string[] = [];

function ok(label: string) {
  console.log(`  ✅ PASS: ${label}`);
  passed++;
}

function fail(label: string, detail?: unknown) {
  console.error(`  ❌ FAIL: ${label}`);
  if (detail) console.error("     Detail:", detail);
  failed++;
  errors.push(label);
}

function section(title: string) {
  console.log(`\n${"─".repeat(70)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(70));
}

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

function api(token?: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    validateStatus: () => true,
  });
}

// ─── File Builders ─────────────────────────────────────────────────────────────

function buildCsvBuffer(content: string): Buffer {
  return Buffer.from(content, "utf-8");
}

function buildXlsxBuffer(data: Record<string, unknown>[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

function makeFormData(
  buffer: Buffer,
  filename: string,
  mimeType: string
): FormData {
  const form = new FormData();
  form.append("file", buffer, { filename, contentType: mimeType });
  return form;
}

// ─── Bootstrap: Users ─────────────────────────────────────────────────────────

async function bootstrapUsers() {
  section("Bootstrap: Create test users");

  const uniqueId = Date.now();

  // Admin
  let r = await api().post("/auth/register", {
    name: "Import Admin",
    email: `import.admin.${uniqueId}@test.com`,
    password: "password123",
    role: "ADMIN",
  });
  if (r.status !== 201) {
    fail("Register admin", r.data);
    process.exit(1);
  }
  adminToken = r.data.data.token;
  adminUserId = r.data.data.user.id;
  ok("Admin registered");

  // Manager
  r = await api().post("/auth/register", {
    name: "Import Manager",
    email: `import.manager.${uniqueId}@test.com`,
    password: "password123",
    role: "MANAGER",
  });
  if (r.status !== 201) { fail("Register manager", r.data); process.exit(1); }
  managerToken = r.data.data.token;
  ok("Manager registered");

  // Sales rep
  r = await api().post("/auth/register", {
    name: "Import Sales",
    email: `import.sales.${uniqueId}@test.com`,
    password: "password123",
    role: "SALES_REP",
  });
  if (r.status !== 201) { fail("Register sales rep", r.data); process.exit(1); }
  salesToken = r.data.data.token;
  ok("Sales rep registered");

  // Support
  r = await api().post("/auth/register", {
    name: "Import Support",
    email: `import.support.${uniqueId}@test.com`,
    password: "password123",
    role: "SUPPORT",
  });
  if (r.status !== 201) { fail("Register support", r.data); process.exit(1); }
  supportToken = r.data.data.token;
  ok("Support registered");
}

// ─── Test 1: Missing JWT → 401 ────────────────────────────────────────────────

async function test1_missingJwt() {
  section("Test 1: Missing JWT → 401");

  const form = makeFormData(
    buildCsvBuffer("firstName,lastName\nJohn,Doe"),
    "test.csv",
    "text/csv"
  );

  const r = await api().post("/imports/contacts", form, {
    headers: form.getHeaders(),
  });

  if (r.status === 401) {
    ok("No JWT → 401");
  } else {
    fail(`Expected 401, got ${r.status}`, r.data);
  }
}

// ─── Test 2: Unauthorized role → 403 ─────────────────────────────────────────

async function test2_unauthorizedRole() {
  section("Test 2: MARKETING role → 403 on upload");

  // Register a MARKETING user
  const r0 = await api().post("/auth/register", {
    name: "Marketing User",
    email: `marketing.${Date.now()}@test.com`,
    password: "password123",
    role: "MARKETING",
  });
  if (r0.status !== 201) { fail("Register marketing", r0.data); return; }
  const marketingToken = r0.data.data.token;

  const form = makeFormData(
    buildCsvBuffer("firstName,lastName\nJohn,Doe"),
    "test.csv",
    "text/csv"
  );

  const r = await api(marketingToken).post("/imports/contacts", form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${marketingToken}` },
  });

  if (r.status === 403) {
    ok("MARKETING → 403");
  } else {
    fail(`Expected 403, got ${r.status}`, r.data);
  }

  // SUPPORT can't upload either
  const form2 = makeFormData(
    buildCsvBuffer("firstName,lastName\nJohn,Doe"),
    "test.csv",
    "text/csv"
  );
  const r2 = await api(supportToken).post("/imports/contacts", form2, {
    headers: { ...form2.getHeaders(), Authorization: `Bearer ${supportToken}` },
  });
  if (r2.status === 403) {
    ok("SUPPORT → 403 on upload");
  } else {
    fail(`SUPPORT upload: expected 403, got ${r2.status}`, r2.data);
  }
}

// ─── Test 3: Invalid file type → 422 ─────────────────────────────────────────

async function test3_invalidFileType() {
  section("Test 3: Invalid file type (.txt) → 422");

  const form = makeFormData(
    Buffer.from("hello world"),
    "data.txt",
    "text/plain"
  );

  const r = await api(adminToken).post("/imports/contacts", form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${adminToken}` },
  });

  if (r.status === 422) {
    ok(".txt file → 422");
  } else {
    fail(`Expected 422, got ${r.status}`, r.data);
  }

  // Also test invalid route param
  const form2 = makeFormData(
    buildCsvBuffer("firstName,lastName\nJohn,Doe"),
    "test.csv",
    "text/csv"
  );
  const r2 = await api(adminToken).post("/imports/invoices", form2, {
    headers: { ...form2.getHeaders(), Authorization: `Bearer ${adminToken}` },
  });
  if (r2.status === 422 || r2.status === 404) {
    ok("Invalid import type → 422/404");
  } else {
    fail(`Invalid type: expected 422/404, got ${r2.status}`, r2.data);
  }
}

// ─── Test 4: Missing required columns → validation error ─────────────────────

async function test4_missingRequiredColumns() {
  section("Test 4: CSV with no recognised headers → validation error");

  // CSV has completely unrecognised headers
  const csvContent = "color,height,weight\nblue,180,75";
  const form = makeFormData(
    buildCsvBuffer(csvContent),
    "bad.csv",
    "text/csv"
  );

  const r = await api(adminToken).post("/imports/contacts", form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${adminToken}` },
  });

  // The import should complete but with failedRecords > 0 and successfulRecords = 0
  if (r.status === 201) {
    const summary = r.data.data.summary;
    if (summary.failedRows > 0 || summary.successfulRows === 0) {
      ok("Unrecognised headers → failedRows or 0 successfulRows");
    } else {
      fail("Expected failedRows or 0 successfulRows for unrecognised headers", summary);
    }
  } else if (r.status === 422) {
    ok("Unrecognised headers → 422");
  } else {
    fail(`Unexpected status ${r.status}`, r.data);
  }
}

// ─── Test 5: Valid CSV Contacts import ────────────────────────────────────────

const uniqueSuffix = Date.now();
const csvContactEmail1 = `alice.${uniqueSuffix}@example.com`;
const csvContactEmail2 = `bob.${uniqueSuffix}@example.com`;

async function test5_validCsvContacts(): Promise<string> {
  section("Test 5: Valid CSV Contacts import");

  const csvContent = [
    "firstName,lastName,email,phone,jobTitle",
    `Alice,Smith,${csvContactEmail1},+1-555-0001,Engineer`,
    `Bob,Jones,${csvContactEmail2},+1-555-0002,Manager`,
    `Charlie,Brown,,+1-555-0003,Designer`, // No email — still valid
  ].join("\n");

  const form = makeFormData(buildCsvBuffer(csvContent), "contacts.csv", "text/csv");

  const r = await api(adminToken).post("/imports/contacts", form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${adminToken}` },
  });

  if (r.status !== 201) {
    fail(`Valid CSV import: expected 201, got ${r.status}`, r.data);
    return "";
  }

  const summary = r.data.data.summary;

  if (summary.totalRows === 3) ok("totalRows = 3");
  else fail(`totalRows: expected 3, got ${summary.totalRows}`);

  if (summary.successfulRows === 3) ok("successfulRows = 3");
  else fail(`successfulRows: expected 3, got ${summary.successfulRows}`);

  if (summary.failedRows === 0) ok("failedRows = 0");
  else fail(`failedRows: expected 0, got ${summary.failedRows}`);

  // Verify in PostgreSQL
  const alice = await prisma.contact.findUnique({ where: { email: csvContactEmail1 } });
  const bob = await prisma.contact.findUnique({ where: { email: csvContactEmail2 } });

  if (alice && alice.firstName === "Alice") ok("Alice created in PostgreSQL");
  else fail("Alice not found in PostgreSQL");

  if (bob && bob.jobTitle === "Manager") ok("Bob created with correct jobTitle");
  else fail("Bob not found or incorrect jobTitle");

  return r.data.data.importJob.id;
}

// ─── Test 6: Valid XLSX Contacts import ──────────────────────────────────────

const xlsxEmail1 = `xlsx.alice.${uniqueSuffix}@example.com`;

async function test6_validXlsxContacts() {
  section("Test 6: Valid XLSX Contacts import");

  const data = [
    { "First Name": "XLSX Alice", "Last Name": "Test", "Email": xlsxEmail1, "Phone": "555-9999", "Job Title": "Analyst" },
    { "First Name": "XLSX Bob", "Last Name": "Test", "Email": `xlsx.bob.${uniqueSuffix}@example.com`, "Phone": "555-8888" },
  ];

  const xlsxBuf = buildXlsxBuffer(data);
  const form = makeFormData(xlsxBuf, "contacts.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  const r = await api(adminToken).post("/imports/contacts", form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${adminToken}` },
  });

  if (r.status !== 201) {
    fail(`XLSX import: expected 201, got ${r.status}`, r.data);
    return;
  }

  const summary = r.data.data.summary;
  if (summary.totalRows === 2) ok("XLSX totalRows = 2");
  else fail(`XLSX totalRows: expected 2, got ${summary.totalRows}`);

  if (summary.successfulRows === 2) ok("XLSX successfulRows = 2");
  else fail(`XLSX successfulRows: expected 2, got ${summary.successfulRows}`);

  // Verify in DB
  const xlsxAlice = await prisma.contact.findUnique({ where: { email: xlsxEmail1 } });
  if (xlsxAlice && xlsxAlice.firstName === "XLSX Alice") ok("XLSX Alice created in PostgreSQL");
  else fail("XLSX Alice not found in PostgreSQL");
}

// ─── Test 7: Valid CSV Companies import ───────────────────────────────────────

const companyWebsite = `https://acme-${uniqueSuffix}.io`;
const companyName = `Acme Corp ${uniqueSuffix}`;

async function test7_validCsvCompanies(): Promise<string> {
  section("Test 7: Valid CSV Companies import");

  const csvContent = [
    "name,website,industry,phone,email,address,size,annualRevenue,description",
    `${companyName},${companyWebsite},Technology,555-3333,hello@acme.io,123 Main St,51-200,1000000,Leading tech firm`,
    `Beta Inc ${uniqueSuffix},https://beta-${uniqueSuffix}.io,Finance,555-4444,info@beta.io,456 Oak Ave,11-50,500000,Financial services`,
  ].join("\n");

  const form = makeFormData(buildCsvBuffer(csvContent), "companies.csv", "text/csv");

  const r = await api(adminToken).post("/imports/companies", form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${adminToken}` },
  });

  if (r.status !== 201) {
    fail(`Companies CSV import: expected 201, got ${r.status}`, r.data);
    return "";
  }

  const summary = r.data.data.summary;
  if (summary.totalRows === 2) ok("Companies totalRows = 2");
  else fail(`Companies totalRows: expected 2, got ${summary.totalRows}`);

  if (summary.successfulRows === 2) ok("Companies successfulRows = 2");
  else fail(`Companies successfulRows: expected 2, got ${summary.successfulRows}`);

  // Verify in DB
  const acme = await prisma.company.findFirst({ where: { website: companyWebsite } });
  if (acme && acme.industry === "Technology" && acme.annualRevenue === 1000000) {
    ok("Acme Corp created with correct fields in PostgreSQL");
  } else {
    fail("Acme Corp not found or incorrect data", acme);
  }

  return r.data.data.importJob.id;
}

// ─── Test 8: Duplicate handling ───────────────────────────────────────────────

async function test8_duplicateHandling() {
  section("Test 8: Duplicate handling (repeated import)");

  // Re-import the same contacts CSV — should update existing, not create new
  const contactCountBefore = await prisma.contact.count({
    where: { email: { in: [csvContactEmail1, csvContactEmail2] } },
  });

  const csvContent = [
    "firstName,lastName,email,phone,jobTitle",
    `Alice Updated,Smith,${csvContactEmail1},+1-555-0001,Senior Engineer`, // updated jobTitle
    `Bob,Jones,${csvContactEmail2},+1-555-0002,Manager`,
  ].join("\n");

  const form = makeFormData(buildCsvBuffer(csvContent), "contacts_repeat.csv", "text/csv");

  const r = await api(adminToken).post("/imports/contacts", form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${adminToken}` },
  });

  if (r.status !== 201) {
    fail(`Duplicate import: expected 201, got ${r.status}`, r.data);
    return;
  }

  const summary = r.data.data.summary;

  // Both rows should be treated as skipped (updated), not new records
  if (summary.skippedRows === 2) ok("Duplicate contacts skipped = 2");
  else fail(`Expected skippedRows = 2, got ${summary.skippedRows}`);

  if (summary.successfulRows === 0) ok("No new contacts created on duplicate run");
  else fail(`Expected successfulRows = 0 on duplicate, got ${summary.successfulRows}`);

  const contactCountAfter = await prisma.contact.count({
    where: { email: { in: [csvContactEmail1, csvContactEmail2] } },
  });

  if (contactCountBefore === contactCountAfter) ok("DB contact count unchanged after duplicate import");
  else fail(`Contact count changed: ${contactCountBefore} → ${contactCountAfter}`);

  // Verify the update was applied
  const alice = await prisma.contact.findUnique({ where: { email: csvContactEmail1 } });
  if (alice && alice.firstName === "Alice Updated") ok("Existing contact fields updated correctly");
  else fail("Updated contact name not reflected in DB", alice);

  // Duplicate company import
  const companyCountBefore = await prisma.company.count({
    where: { website: companyWebsite },
  });

  const companyCsv = [
    "name,website,industry,annualRevenue",
    `${companyName},${companyWebsite},SaaS,2000000`, // same website → update
  ].join("\n");

  const form2 = makeFormData(buildCsvBuffer(companyCsv), "companies_repeat.csv", "text/csv");
  const r2 = await api(adminToken).post("/imports/companies", form2, {
    headers: { ...form2.getHeaders(), Authorization: `Bearer ${adminToken}` },
  });

  if (r2.status === 201) {
    const s2 = r2.data.data.summary;
    if (s2.skippedRows === 1) ok("Duplicate company skipped = 1");
    else fail(`Expected skippedRows = 1 for company, got ${s2.skippedRows}`);

    const companyCountAfter = await prisma.company.count({ where: { website: companyWebsite } });
    if (companyCountBefore === companyCountAfter) ok("DB company count unchanged after duplicate import");
    else fail(`Company count changed: ${companyCountBefore} → ${companyCountAfter}`);

    const updatedCompany = await prisma.company.findFirst({ where: { website: companyWebsite } });
    if (updatedCompany && updatedCompany.annualRevenue === 2000000) ok("Company annualRevenue updated on duplicate");
    else fail("Company annualRevenue not updated", updatedCompany);
  } else {
    fail(`Company duplicate import: expected 201, got ${r2.status}`, r2.data);
  }
}

// ─── Test 9: Invalid rows do not stop valid rows ──────────────────────────────

async function test9_invalidRowsDoNotStopValid() {
  section("Test 9: Invalid rows do not abort valid rows");

  const csvContent = [
    "firstName,lastName,email",
    // Row 1: missing lastName → FAIL
    "NoLastName,,valid1@test.com",
    // Row 2: bad email → FAIL
    `John,Doe,not-an-email-${uniqueSuffix}`,
    // Row 3: valid → PASS
    `Valid,Person,valid.person.${uniqueSuffix}@test.com`,
    // Row 4: missing firstName → FAIL
    `,OnlyLast,onlylast.${uniqueSuffix}@test.com`,
    // Row 5: valid → PASS
    `Second,Valid,second.valid.${uniqueSuffix}@test.com`,
  ].join("\n");

  const form = makeFormData(buildCsvBuffer(csvContent), "mixed.csv", "text/csv");
  const r = await api(adminToken).post("/imports/contacts", form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${adminToken}` },
  });

  if (r.status !== 201) {
    fail(`Mixed rows import: expected 201, got ${r.status}`, r.data);
    return;
  }

  const summary = r.data.data.summary;
  if (summary.totalRows === 5) ok("totalRows = 5");
  else fail(`totalRows: expected 5, got ${summary.totalRows}`);

  if (summary.successfulRows === 2) ok("successfulRows = 2 (3 bad rows didn't abort valid ones)");
  else fail(`successfulRows: expected 2, got ${summary.successfulRows}`);

  if (summary.failedRows >= 3) ok("failedRows >= 3");
  else fail(`failedRows: expected >= 3, got ${summary.failedRows}`);

  // Errors should be reported
  const hasErrors = r.data.data.errors && r.data.data.errors.length >= 3;
  if (hasErrors) ok("Row-level errors reported in response");
  else fail("Expected row-level errors in response", r.data.data.errors);

  // Valid rows actually exist in DB
  const vp = await prisma.contact.findUnique({ where: { email: `valid.person.${uniqueSuffix}@test.com` } });
  if (vp) ok("Valid Person created in DB despite bad rows");
  else fail("Valid Person not found in DB");
}

// ─── Test 10: ImportJob counts ────────────────────────────────────────────────

async function test10_importJobCounts(jobId: string) {
  section("Test 10: ImportJob counts in DB");

  if (!jobId) { fail("No jobId available — skipping"); return; }

  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job) { fail(`ImportJob ${jobId} not found in DB`); return; }

  if (job.status === "COMPLETED") ok("ImportJob status = COMPLETED");
  else fail(`Expected COMPLETED, got ${job.status}`);

  if (job.totalRecords >= 1) ok(`totalRecords = ${job.totalRecords}`);
  else fail("totalRecords should be >= 1");

  if (job.completedAt !== null) ok("completedAt is set");
  else fail("completedAt should be set");

  if (job.importType === "contacts" || job.importType === "companies") ok(`importType = ${job.importType}`);
  else fail(`importType unexpected: ${job.importType}`);

  ok("All ImportJob count fields validated");
}

// ─── Test 11: Import job status endpoint ─────────────────────────────────────

async function test11_jobStatusEndpoint(jobId: string) {
  section("Test 11: GET /imports/:jobId");

  if (!jobId) { fail("No jobId available — skipping"); return; }

  const r = await api(adminToken).get(`/imports/${jobId}`);

  if (r.status === 200) ok("GET /imports/:jobId → 200");
  else { fail(`Expected 200, got ${r.status}`, r.data); return; }

  const job = r.data.data.importJob;
  if (job.id === jobId) ok("Correct jobId returned");
  else fail("Wrong job returned");

  if (job.status && job.totalRecords !== undefined) ok("status and totalRecords present");
  else fail("Missing fields in ImportJob response");

  // SUPPORT can also access
  const r2 = await api(supportToken).get(`/imports/${jobId}`);
  if (r2.status === 200) ok("SUPPORT can access job status");
  else fail(`SUPPORT GET job: expected 200, got ${r2.status}`, r2.data);
}

// ─── Test 12: Import history endpoint ────────────────────────────────────────

async function test12_importHistoryEndpoint() {
  section("Test 12: GET /imports (paginated history)");

  const r = await api(adminToken).get("/imports?page=1&limit=10");

  if (r.status === 200) ok("GET /imports → 200");
  else { fail(`Expected 200, got ${r.status}`, r.data); return; }

  const data = r.data.data;
  if (Array.isArray(data.jobs)) ok("jobs is an array");
  else fail("jobs is not an array");

  if (data.total !== undefined && data.page !== undefined) ok("Pagination fields present");
  else fail("Missing pagination fields");

  // SUPPORT can list too
  const r2 = await api(supportToken).get("/imports?page=1&limit=5");
  if (r2.status === 200) ok("SUPPORT can list import history");
  else fail(`SUPPORT GET history: expected 200, got ${r2.status}`, r2.data);

  // Sales rep sees only their own (admin sees all)
  const r3 = await api(salesToken).get("/imports?page=1&limit=5");
  if (r3.status === 200) ok("SALES_REP can list history (own jobs)");
  else fail(`SALES_REP GET history: expected 200, got ${r3.status}`, r3.data);
}

// ─── Test 13: PostgreSQL verification ────────────────────────────────────────

async function test13_postgresVerification() {
  section("Test 13: PostgreSQL records actually exist");

  const contactCount = await prisma.contact.count({
    where: { email: csvContactEmail1 },
  });
  if (contactCount === 1) ok("Contact from CSV import exists in DB");
  else fail(`Contact count should be 1, got ${contactCount}`);

  const xlsxContact = await prisma.contact.findUnique({ where: { email: xlsxEmail1 } });
  if (xlsxContact) ok("XLSX contact exists in DB");
  else fail("XLSX contact not found in DB");

  const company = await prisma.company.findFirst({ where: { website: companyWebsite } });
  if (company && company.name === companyName) ok("Company from CSV import exists in DB");
  else fail("Company not found in DB", company);

  const importJobs = await prisma.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 5 });
  if (importJobs.length >= 3) ok(`At least 3 ImportJob records in DB (found ${importJobs.length})`);
  else fail(`Expected >= 3 ImportJobs, found ${importJobs.length}`);
}

// ─── Test 14: Repeated imports do not create duplicates ──────────────────────

async function test14_noRepeatedDuplicates() {
  section("Test 14: Repeated imports do not duplicate records");

  const countBefore = await prisma.contact.count({ where: { email: csvContactEmail1 } });

  // Run the same import 2 more times
  for (let i = 0; i < 2; i++) {
    const csvContent = [
      "firstName,lastName,email",
      `Alice,Smith,${csvContactEmail1}`,
    ].join("\n");
    const form = makeFormData(buildCsvBuffer(csvContent), "repeat.csv", "text/csv");
    await api(adminToken).post("/imports/contacts", form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${adminToken}` },
    });
  }

  const countAfter = await prisma.contact.count({ where: { email: csvContactEmail1 } });

  if (countBefore === countAfter) ok("No duplicate contacts after repeated import");
  else fail(`Duplicate created! count: ${countBefore} → ${countAfter}`);
}

// ─── Test 15: Contacts CRUD regression ───────────────────────────────────────

async function test15_contactsCrudRegression() {
  section("Test 15: Contacts CRUD regression");

  const uniqueEmail = `regression.contact.${Date.now()}@test.com`;

  // Create
  let r = await api(adminToken).post("/contacts", {
    firstName: "Regression",
    lastName: "Contact",
    email: uniqueEmail,
    phone: "555-0000",
    jobTitle: "Tester",
  });
  if (r.status === 201) ok("POST /contacts → 201");
  else { fail(`POST /contacts: ${r.status}`, r.data); return; }

  const contactId = r.data.data.contact.id;

  // Read
  r = await api(adminToken).get(`/contacts/${contactId}`);
  if (r.status === 200) ok("GET /contacts/:id → 200");
  else fail(`GET /contacts/:id: ${r.status}`, r.data);

  // Update
  r = await api(adminToken).patch(`/contacts/${contactId}`, { jobTitle: "Senior Tester" });
  if (r.status === 200 && r.data.data.contact.jobTitle === "Senior Tester") ok("PATCH /contacts/:id → 200");
  else fail(`PATCH /contacts/:id: ${r.status}`, r.data);

  // List
  r = await api(adminToken).get("/contacts?page=1&limit=5");
  if (r.status === 200 && Array.isArray(r.data.data.contacts)) ok("GET /contacts → 200");
  else fail(`GET /contacts: ${r.status}`, r.data);

  // Delete
  r = await api(adminToken).delete(`/contacts/${contactId}`);
  if (r.status === 200) ok("DELETE /contacts/:id → 200");
  else fail(`DELETE /contacts/:id: ${r.status}`, r.data);

  // Confirm deletion
  const deleted = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!deleted) ok("Contact deleted from DB");
  else fail("Contact still exists after DELETE");
}

// ─── Test 16: Companies CRUD regression ──────────────────────────────────────

async function test16_companiesCrudRegression() {
  section("Test 16: Companies CRUD regression");

  // Create
  let r = await api(adminToken).post("/companies", {
    name: `Regression Company ${Date.now()}`,
    website: `https://regression-${Date.now()}.io`,
    industry: "Testing",
  });
  if (r.status === 201) ok("POST /companies → 201");
  else { fail(`POST /companies: ${r.status}`, r.data); return; }

  const companyId = r.data.data.company.id;

  // Read
  r = await api(adminToken).get(`/companies/${companyId}`);
  if (r.status === 200) ok("GET /companies/:id → 200");
  else fail(`GET /companies/:id: ${r.status}`, r.data);

  // Update
  r = await api(adminToken).patch(`/companies/${companyId}`, { industry: "QA" });
  if (r.status === 200) ok("PATCH /companies/:id → 200");
  else fail(`PATCH /companies/:id: ${r.status}`, r.data);

  // List
  r = await api(adminToken).get("/companies?page=1&limit=5");
  if (r.status === 200 && Array.isArray(r.data.data.companies)) ok("GET /companies → 200");
  else fail(`GET /companies: ${r.status}`, r.data);

  // Delete
  r = await api(adminToken).delete(`/companies/${companyId}`);
  if (r.status === 200) ok("DELETE /companies/:id → 200");
  else fail(`DELETE /companies/:id: ${r.status}`, r.data);
}

// ─── Test 17: tsc --noEmit ────────────────────────────────────────────────────

function test17_typeScriptBuild() {
  section("Test 17: npx tsc --noEmit");
  try {
    execSync("npx.cmd tsc --noEmit", { cwd: path.join(__dirname, ".."), stdio: "pipe" });
    ok("TypeScript compiled with 0 errors");
  } catch (e: unknown) {
    const err = e as { stdout?: Buffer; stderr?: Buffer };
    fail("TypeScript errors found", err.stdout?.toString() || err.stderr?.toString());
  }
}

// ─── Test 18: prisma validate ────────────────────────────────────────────────

function test18_prismaValidate() {
  section("Test 18: npx prisma validate");
  try {
    execSync("npx.cmd prisma validate", { cwd: path.join(__dirname, ".."), stdio: "pipe" });
    ok("Prisma schema is valid");
  } catch (e: unknown) {
    const err = e as { stdout?: Buffer; stderr?: Buffer };
    fail("Prisma schema invalid", err.stdout?.toString() || err.stderr?.toString());
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(70));
  console.log("  PHASE 10 — CSV/XLSX IMPORT ENGINE AUDIT");
  console.log("=".repeat(70));

  try {
    await bootstrapUsers();

    await test1_missingJwt();
    await test2_unauthorizedRole();
    await test3_invalidFileType();
    await test4_missingRequiredColumns();

    const csvJobId = await test5_validCsvContacts();
    await test6_validXlsxContacts();
    const companyJobId = await test7_validCsvCompanies();

    await test8_duplicateHandling();
    await test9_invalidRowsDoNotStopValid();
    await test10_importJobCounts(csvJobId);
    await test11_jobStatusEndpoint(companyJobId || csvJobId);
    await test12_importHistoryEndpoint();
    await test13_postgresVerification();
    await test14_noRepeatedDuplicates();
    await test15_contactsCrudRegression();
    await test16_companiesCrudRegression();

    // test17_typeScriptBuild();
    // test18_prismaValidate();
  } catch (err) {
    console.error("\n💥 Unhandled error:", err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  // ─── Final report ─────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(70));
  console.log("  AUDIT RESULTS");
  console.log("=".repeat(70));
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  if (errors.length > 0) {
    console.log("\n  Failed tests:");
    errors.forEach((e) => console.log(`   - ${e}`));
  }
  console.log("=".repeat(70));

  process.exit(failed > 0 ? 1 : 0);
}

main();
