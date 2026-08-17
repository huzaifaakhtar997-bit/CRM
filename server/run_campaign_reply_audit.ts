/**
 * Phase 8G – Campaign Replies → Unified Inbox Integration Test Suite
 * ──────────────────────────────────────────────────────────────────────────
 * Tests the full campaign reply workflow:
 *  - JWT / RBAC checks
 *  - 404 on unknown campaign / recipient
 *  - 422 on invalid payload
 *  - New conversation auto-created on first reply
 *  - Existing conversation reused on second reply
 *  - CampaignRecipient set to REPLIED + repliedAt populated
 *  - Message stored as senderType=CUSTOMER, isInternalNote=false
 *  - Activity logs verified
 *  - Regression check
 *
 * Run with:  npx ts-node run_campaign_reply_audit.ts
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
const adminEmail = `audit8g_admin_${TIMESTAMP}@crm.test`;
const salesEmail = `audit8g_sales_${TIMESTAMP}@crm.test`;
const recipientContactEmail = `reply_contact_${TIMESTAMP}@customer.test`;
const PASSWORD = "Audit8g!Pass";

let adminToken = "";
let salesToken = "";
let campaignId = "";
let contactId = "";
let recipientId = "";

async function main() {
  console.log("\n==================================================");
  console.log("   PHASE 8G — CAMPAIGN REPLY INBOX AUDIT SUITE   ");
  console.log("==================================================\n");

  // 1. Bootstrap
  console.log("1️⃣  Bootstrap Auth, Contact, Campaign & Recipient…");
  await axios.post(`${API}/auth/register`, {
    name: "Audit Admin 8G",
    email: adminEmail,
    password: PASSWORD,
    role: "ADMIN",
  });

  await axios.post(`${API}/auth/register`, {
    name: "Audit Sales 8G",
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

  // Create contact whose email will be the "reply sender"
  const contact = await prisma.contact.create({
    data: {
      firstName: "ReplyContact",
      lastName: "Customer",
      email: recipientContactEmail,
    },
  });
  contactId = contact.id;

  // Create campaign (complete)
  const campaignRes = await axios.post(
    `${API}/campaigns`,
    {
      name: `Reply Campaign ${TIMESTAMP}`,
      subject: "Summer Promotion",
      content: "<p>Check out our deals!</p>",
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  campaignId = campaignRes.data.data.campaign.id;

  // Attach recipient to campaign (SENT status to allow REPLIED transition)
  const rec = await prisma.campaignRecipient.create({
    data: {
      campaignId,
      contactId,
      status: "SENT",
      sentAt: new Date(),
    },
  });
  recipientId = rec.id;

  ok(`Campaign and Recipient configured. campaignId=${campaignId}, recipientId=${recipientId}`);

  // 2. RBAC checks
  console.log("\n2️⃣  RBAC checks (Missing JWT, SALES_REP block)…");
  await expect401("POST /reply without token", () =>
    axios.post(`${API}/campaigns/${campaignId}/reply`, {
      recipientEmail: recipientContactEmail,
      subject: "Re: Summer Promotion",
      content: "Interested!",
    })
  );
  await expect403("SALES_REP attempt reply processing", () =>
    axios.post(
      `${API}/campaigns/${campaignId}/reply`,
      { recipientEmail: recipientContactEmail, subject: "Re: test", content: "Hi" },
      { headers: { Authorization: `Bearer ${salesToken}` } }
    )
  );

  // 3. 404 checks
  console.log("\n3️⃣  404 on invalid parameters…");
  await expect404("POST reply with invalid campaignId", () =>
    axios.post(
      `${API}/campaigns/nonexistent-campaign-id/reply`,
      { recipientEmail: recipientContactEmail, subject: "Re: test", content: "Hi" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );
  await expect404("POST reply with unknown recipientEmail", () =>
    axios.post(
      `${API}/campaigns/${campaignId}/reply`,
      { recipientEmail: "nobody@unknown.com", subject: "Re: test", content: "Hi" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 4. Validation checks (422)
  console.log("\n4️⃣  Zod payload validation checks (422)…");
  await expect422("POST reply with invalid email", () =>
    axios.post(
      `${API}/campaigns/${campaignId}/reply`,
      { recipientEmail: "not-an-email", subject: "Re: test", content: "Hi" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );
  await expect422("POST reply with empty content", () =>
    axios.post(
      `${API}/campaigns/${campaignId}/reply`,
      { recipientEmail: recipientContactEmail, subject: "Re: test", content: "" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );
  await expect422("POST reply with empty subject", () =>
    axios.post(
      `${API}/campaigns/${campaignId}/reply`,
      { recipientEmail: recipientContactEmail, subject: "", content: "Hi" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
  );

  // 5. First valid reply → auto-creates conversation
  console.log("\n5️⃣  First Reply → Conversation auto-created…");
  const firstReplyRes = await axios.post(
    `${API}/campaigns/${campaignId}/reply`,
    {
      recipientEmail: `  ${recipientContactEmail.toUpperCase()}  `, // test normalize
      subject: "Re: Summer Promotion",
      content: "I'd like more information before purchasing.",
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (firstReplyRes.status !== 200) fail("First Reply", `Expected 200, got ${firstReplyRes.status}`);
  const firstData = firstReplyRes.data.data;
  if (firstData.campaignRecipientStatus !== "REPLIED") fail("Recipient status", "Expected REPLIED status");
  if (!firstData.conversationId || !firstData.messageId || !firstData.contactId) {
    fail("Response shape", "conversationId / messageId / contactId missing");
  }
  const conversationId = firstData.conversationId;
  ok("Conversation auto-created. conversationId: " + conversationId);
  ok("Message stored. messageId: " + firstData.messageId);
  ok("CampaignRecipient set to REPLIED");

  // 6. Second reply → existing conversation reused
  console.log("\n6️⃣  Second Reply → Existing conversation reused…");
  const secondReplyRes = await axios.post(
    `${API}/campaigns/${campaignId}/reply`,
    {
      recipientEmail: recipientContactEmail,
      subject: "Re: Summer Promotion (follow-up)",
      content: "Actually, I will go ahead and purchase.",
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (secondReplyRes.status !== 200) fail("Second Reply", `Expected 200, got ${secondReplyRes.status}`);
  const secondData = secondReplyRes.data.data;
  if (secondData.conversationId !== conversationId) {
    fail("Conversation reuse", `Expected same conversationId=${conversationId}, got ${secondData.conversationId}`);
  }
  ok("Existing conversation reused. Same conversationId: " + secondData.conversationId);

  // 7. PostgreSQL verification
  console.log("\n7️⃣  PostgreSQL Verification…");

  // Conversation exists exactly once for this contact
  const dbConversations = await prisma.conversation.findMany({ where: { contactId } });
  if (dbConversations.length !== 1) fail("Conversation count", `Expected 1 conversation, got ${dbConversations.length}`);
  ok("Exactly 1 conversation exists in DB for the contact");

  // Two messages in that conversation
  const dbMessages = await prisma.message.findMany({ where: { conversationId } });
  if (dbMessages.length !== 2) fail("Message count", `Expected 2 messages, got ${dbMessages.length}`);
  const allCustomer = dbMessages.every((m) => m.senderType === "CUSTOMER" && m.isInternalNote === false);
  if (!allCustomer) fail("Message senderType", "All messages must be senderType=CUSTOMER, isInternalNote=false");
  ok("2 CUSTOMER messages stored correctly in conversation");

  // Recipient status and repliedAt
  const dbRecipient = await prisma.campaignRecipient.findUnique({ where: { id: recipientId } });
  if (dbRecipient?.status !== "REPLIED") fail("DB Recipient status", "Expected REPLIED in DB");
  if (!dbRecipient?.repliedAt) fail("DB repliedAt", "repliedAt not populated");
  ok("CampaignRecipient status=REPLIED, repliedAt=" + dbRecipient!.repliedAt);

  // 8. Activity Log verification
  console.log("\n8️⃣  Activity Log Verification…");
  const adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
  const replyReceivedLog = await prisma.activity.findFirst({
    where: { title: "Campaign Reply Received", userId: adminUser?.id },
  });
  if (!replyReceivedLog) fail("Activity Log", "Missing Campaign Reply Received activity log");
  ok("Verified: " + replyReceivedLog!.content);

  const convCreatedLog = await prisma.activity.findFirst({
    where: { title: "Conversation Created From Campaign", userId: adminUser?.id },
  });
  if (!convCreatedLog) fail("Activity Log", "Missing Conversation Created From Campaign activity log");
  ok("Verified: " + convCreatedLog!.content);

  const convReusedLog = await prisma.activity.findFirst({
    where: { title: "Campaign Reply Added To Existing Conversation", userId: adminUser?.id },
  });
  if (!convReusedLog) fail("Activity Log", "Missing Campaign Reply Added To Existing Conversation activity log");
  ok("Verified: " + convReusedLog!.content);

  // 9. Regression check
  console.log("\n9️⃣  Full Regression check…");
  const contactsReg = await axios.get(`${API}/contacts?page=1&limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (contactsReg.status !== 200) fail("Regression: Contacts", "GET /contacts failed");
  ok("Contacts CRUD: OK");

  const campaignsReg = await axios.get(`${API}/campaigns`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (campaignsReg.status !== 200) fail("Regression: Campaigns", "GET /campaigns failed");
  ok("Campaigns CRUD: OK");

  // Cleanup
  await prisma.message.deleteMany({ where: { conversationId } });
  await prisma.conversation.delete({ where: { id: conversationId } });
  await prisma.campaignRecipient.deleteMany({ where: { campaignId } });
  await prisma.campaign.delete({ where: { id: campaignId } });
  await prisma.contact.delete({ where: { id: contactId } });
  await prisma.$disconnect();

  console.log("\n==================================================");
  console.log("   PHASE 8G — CAMPAIGN REPLY INBOX AUDIT PASSED  ");
  console.log("==================================================\n");
}

main().catch(async (e) => {
  console.error("❌ Audit suite crashed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
