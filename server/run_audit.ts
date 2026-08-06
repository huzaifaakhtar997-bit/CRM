import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_URL = "http://localhost:5000/api/v1";

async function runGlobalAudit() {
  console.log("==================================================");
  console.log("      CRM BACKEND GLOBAL INTEGRITY AUDIT          ");
  console.log("==================================================\n");

  const email = "audit.admin@example.com";
  const password = "Password123!";

  // CLEANUP test entities
  await prisma.activity.deleteMany({ where: { user: { email } } });
  await prisma.message.deleteMany({ where: { content: { contains: "Audit" } } });
  await prisma.template.deleteMany({ where: { name: { contains: "Audit" } } });
  await prisma.task.deleteMany({ where: { title: { contains: "Audit" } } });
  await prisma.deal.deleteMany({ where: { title: { contains: "Audit" } } });
  await prisma.lead.deleteMany({ where: { email: { contains: "audit" } } });
  await prisma.contact.deleteMany({ where: { email: { contains: "audit" } } });
  await prisma.company.deleteMany({ where: { name: { contains: "Audit" } } });
  await prisma.user.deleteMany({ where: { email } });

  // 1. AUTHENTICATION & REGISTRATION
  console.log("1️⃣ Testing Authentication & Register...");
  const regRes = await axios.post(`${API_URL}/auth/register`, {
    name: "Audit User",
    email,
    password,
    role: "ADMIN",
  });
  const token = regRes.data.data.token;
  const userId = regRes.data.data.user.id;
  console.log(`   Admin Registered successfully. User ID: ${userId}`);

  const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
  const authToken = loginRes.data.data.token;
  console.log(`   Login verified. Token obtained.`);

  const meRes = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${authToken}` } });
  console.log(`   GET /auth/me verified. Role: ${meRes.data.data.user.role}\n`);

  // 2. CONTACTS & COMPANIES
  console.log("2️⃣ Testing Companies & Contacts...");
  const companyRes = await axios.post(
    `${API_URL}/companies`,
    { name: "Audit Tech Ltd", industry: "Technology", size: "51-200" },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  const companyId = companyRes.data.data.company.id;
  console.log(`   Company created. ID: ${companyId}`);

  const contactRes = await axios.post(
    `${API_URL}/contacts`,
    { firstName: "Audit", lastName: "Contact", email: "audit.contact@example.com", companyId },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  const contactId = contactRes.data.data.contact.id;
  console.log(`   Contact created and associated. ID: ${contactId}\n`);

  // 3. LEADS & DEALS
  console.log("3️⃣ Testing Leads & Deals...");
  const leadRes = await axios.post(
    `${API_URL}/leads`,
    { firstName: "Audit", lastName: "Lead", email: "audit.lead@example.com", company: "Audit FreeCorp" },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  const leadId = leadRes.data.data.lead.id;
  console.log(`   Lead created. ID: ${leadId}`);

  const stages = await prisma.pipelineStage.findMany({ orderBy: { order: "asc" } });
  const dealRes = await axios.post(
    `${API_URL}/deals`,
    {
      title: "Audit Deal Alpha",
      value: 95000,
      expectedCloseDate: "2026-12-31",
      stageId: stages[0].id,
      companyId,
      contactId,
    },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  const dealId = dealRes.data.data.deal.id;
  console.log(`   Deal created. ID: ${dealId}\n`);

  // 4. PIPELINE TRANSTIONS
  console.log("4️⃣ Testing Pipeline Stage Transitions...");
  for (const st of stages) {
    const moveRes = await axios.patch(
      `${API_URL}/deals/${dealId}/stage`,
      { stageId: st.id, lostReason: st.isLost ? "Audit test loss" : undefined },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log(`   Moved to "${st.name}" -> Probability: ${moveRes.data.data.deal.probability}%, closedAt: ${moveRes.data.data.deal.closedAt !== null}`);
  }
  console.log("   Pipeline transitions verified.\n");

  // 5. TASKS
  console.log("5️⃣ Testing Tasks...");
  const taskRes = await axios.post(
    `${API_URL}/tasks`,
    {
      title: "Audit Verify Task",
      priority: "HIGH",
      dueDate: "2026-10-10",
      assignedUserId: userId,
      contactId,
      dealId,
    },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  const taskId = taskRes.data.data.task.id;
  console.log(`   Task created. ID: ${taskId}`);

  const completeRes = await axios.patch(
    `${API_URL}/tasks/${taskId}`,
    { completed: true },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  console.log(`   Task completed: ${completeRes.data.data.task.completed} | completedAt: ${completeRes.data.data.task.completedAt}\n`);

  // 6. CONVERSATIONS & MESSAGES
  console.log("6️⃣ Testing Conversations, Messages & Replies...");
  const convoRes = await axios.post(
    `${API_URL}/conversations`,
    { subject: "Audit Convo Thread", channel: "EMAIL", status: "OPEN" },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  const convoId = convoRes.data.data.conversation.id;
  console.log(`   Conversation created. ID: ${convoId}`);

  const msgRes = await axios.post(
    `${API_URL}/conversations/${convoId}/messages`,
    { content: "Audit Customer Message", senderType: "CUSTOMER", senderName: "Customer" },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  const msgId = msgRes.data.data.message.id;
  console.log(`   Customer message created. ID: ${msgId}`);

  const replyRes = await axios.post(
    `${API_URL}/conversations/${convoId}/reply`,
    { content: "Audit Outbound Response" },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  console.log(`   Outbound reply created. ID: ${replyRes.data.data.message.id}`);

  const noteRes = await axios.post(
    `${API_URL}/conversations/${convoId}/notes`,
    { content: "Audit Private Note" },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  console.log(`   Internal note created. ID: ${noteRes.data.data.message.id}`);

  // 7. TEMPLATES
  console.log("\n7️⃣ Testing Reply Templates...");
  const templateRes = await axios.post(
    `${API_URL}/templates`,
    { name: "Audit Template Greeting", content: "Hello {{customerName}}!" },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  const templateId = templateRes.data.data.template.id;
  console.log(`   Template created. ID: ${templateId}`);

  const replyTmplRes = await axios.post(
    `${API_URL}/conversations/${convoId}/reply/template`,
    { templateId, variables: { customerName: "Sarah Connor" } },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  console.log(`   Reply with template sent. Content: "${replyTmplRes.data.data.message.content}"`);

  // 8. AUTO-LINK CONTACT
  console.log("\n8️⃣ Testing Auto-Link / Create Contact from Conversation...");
  const linkContactRes = await axios.post(
    `${API_URL}/conversations/${convoId}/contact`,
    { firstName: "AuditLink", lastName: "NewContact", email: "audit.link@example.com" },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  console.log(`   Created and Linked Contact from Convo. Linked Contact Name: ${linkContactRes.data.data.conversation.contact?.firstName}\n`);

  console.log("==================================================");
  console.log("     GLOBAL INTEGRITY AUDIT SUITE PASSED          ");
  console.log("==================================================");
}

runGlobalAudit()
  .catch((err) => console.error("❌ Audit Test Failed:", err.response?.data || err.message))
  .finally(() => prisma.$disconnect());
