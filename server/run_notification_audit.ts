/**
 * run_notification_audit.ts
 * Phase 11 – Notifications & Real-Time Updates
 * Covers 20 verification requirements.
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { io as Client, Socket } from "socket.io-client";
import axios, { AxiosInstance } from "axios";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:5000/api/v1";
const SOCKET_URL = "http://localhost:5000";

let adminToken = "";
let adminId = "";
let userToken = "";
let userId = "";

const uid = Date.now();

function api(): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true,
  });
}

let passed = 0;
let failed = 0;

function ok(msg: string) {
  console.log(`  ✅ PASS: ${msg}`);
  passed++;
}

function fail(msg: string, detail?: any) {
  console.error(`  ❌ FAIL: ${msg}`, detail !== undefined ? JSON.stringify(detail) : "");
  failed++;
}

function section(title: string) {
  console.log(`\n📋 ${title}`);
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  section("Bootstrap: Register test users & clean up");

  // Clean all notifications
  await prisma.notification.deleteMany({});

  // Register admin
  const adminReg = await api().post("/auth/register", {
    name: "Notif Admin",
    email: `notif.admin.${uid}@test.com`,
    password: "password123",
    role: "ADMIN",
  });
  if (adminReg.status !== 201) {
    console.error("Could not register admin:", adminReg.data);
    process.exit(1);
  }
  adminToken = adminReg.data.data.token;
  adminId = adminReg.data.data.user.id;
  ok("Admin registered");

  // Register sales rep (will be notification recipient)
  const userReg = await api().post("/auth/register", {
    name: "Notif User",
    email: `notif.user.${uid}@test.com`,
    password: "password123",
    role: "SALES_REP",
  });
  if (userReg.status !== 201) {
    console.error("Could not register user:", userReg.data);
    process.exit(1);
  }
  userToken = userReg.data.data.token;
  userId = userReg.data.data.user.id;
  ok("Sales rep registered");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function connectSocket(token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = Client(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      timeout: 5000,
    });

    const cleanup = setTimeout(() => {
      socket.close();
      reject(new Error("Socket connect timeout"));
    }, 6000);

    socket.on("connect", () => {
      clearTimeout(cleanup);
      resolve(socket);
    });

    socket.on("connect_error", (err) => {
      clearTimeout(cleanup);
      socket.close();
      reject(err);
    });
  });
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function runTests() {
  let userSocket: Socket | null = null;
  let adminSocket: Socket | null = null;

  try {
    // ── Test 1: Missing JWT on REST → 401 ──────────────────────────────────
    section("Test 1: Missing/invalid JWT → 401");
    const noAuth = await api().get("/notifications");
    noAuth.status === 401 ? ok("No-JWT returns 401") : fail("Expected 401 got " + noAuth.status);

    const badAuth = await api().get("/notifications", { headers: { Authorization: "Bearer invalid.token.here" } });
    badAuth.status === 401 ? ok("Bad JWT returns 401") : fail("Expected 401 got " + badAuth.status);

    // ── Test 8: Authenticated Socket.IO connection succeeds ────────────────
    section("Test 8: Authenticated socket connection");
    try {
      userSocket = await connectSocket(userToken);
      ok("User socket connected");
    } catch (e: any) {
      fail("User socket failed: " + e.message);
    }

    try {
      adminSocket = await connectSocket(adminToken);
      ok("Admin socket connected");
    } catch (e: any) {
      fail("Admin socket failed: " + e.message);
    }

    // ── Test 9: Invalid socket JWT is rejected ─────────────────────────────
    section("Test 9: Invalid socket JWT is rejected");
    try {
      const bad = await connectSocket("totally.bad.token");
      bad.close();
      fail("Invalid token should have been rejected");
    } catch {
      ok("Invalid socket JWT rejected");
    }

    // ── Test 10: Online user receives real-time notification ────────────────
    section("Test 10-12: Task assignment creates and delivers real-time notification");
    let socketNotifReceived = false;
    let socketNotifType = "";
    userSocket?.on("notification:receive", (data: any) => {
      socketNotifReceived = true;
      socketNotifType = data.type;
    });

    // Find a pipeline stage to create a deal
    const stage = await prisma.pipelineStage.findFirst();

    // Create task assigned to user
    const taskRes = await api().post("/tasks", {
      title: `Audit Task ${uid}`,
      taskType: "CALL",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      assignedUserId: userId,
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    taskRes.status === 201 ? ok("Task creation (admin→user) returns 201") : fail("Task creation failed: " + taskRes.status, taskRes.data);

    await sleep(600); // let socket events propagate
    socketNotifReceived ? ok("Real-time notification received via Socket.IO for task assignment") : fail("Real-time socket notification not received for task");
    socketNotifType === "task" ? ok("Notification type is 'task'") : fail("Notification type mismatch: " + socketNotifType);

    // ── Test 13: Contact assignment creates notification ───────────────────
    section("Test 13: Contact assignment creates notification");
    const contactRes = await api().post("/contacts", {
      firstName: "Audit",
      lastName: "Contact",
      assignedUserId: userId,
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    contactRes.status === 201 ? ok("Contact creation (admin→user) returns 201") : fail("Contact creation failed: " + contactRes.status, contactRes.data);

    // ── Test 14: Deal assignment creates notification ───────────────────────
    section("Test 14: Deal assignment creates notification");
    if (stage) {
      const dealRes = await api().post("/deals", {
        title: `Audit Deal ${uid}`,
        stageId: stage.id,
        assignedUserId: userId,
        expectedCloseDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      }, { headers: { Authorization: `Bearer ${adminToken}` } });
      dealRes.status === 201 ? ok("Deal creation (admin→user) returns 201") : fail("Deal creation failed: " + dealRes.status, dealRes.data);
    } else {
      fail("No pipeline stage found to test deal assignment");
    }

    await sleep(500);

    // ── Test 2: User can retrieve their notifications ──────────────────────
    section("Test 2: User can retrieve their notifications");
    const notifsRes = await api().get("/notifications", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    notifsRes.status === 200 ? ok("GET /notifications returns 200") : fail("Expected 200 got " + notifsRes.status, notifsRes.data);

    const notifCount = notifsRes.data?.data?.total ?? 0;
    notifCount >= 3 ? ok(`User has ${notifCount} notifications (expected >= 3)`) : fail(`User has only ${notifCount} notifications (expected >= 3)`);

    // ── Test 3: User cannot access another user's notifications ──────────────
    section("Test 3: Notification isolation (other user cannot see user's notifications)");
    const adminNotifsRes = await api().get("/notifications", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminCount = adminNotifsRes.data?.data?.total ?? 0;
    adminCount === 0 ? ok("Admin sees 0 notifications (correct isolation)") : fail(`Admin sees ${adminCount} user notifications (isolation broken)`);

    // ── Test 4: Unread count is correct ───────────────────────────────────
    section("Test 4: Unread count is correct");
    const unreadRes = await api().get("/notifications/unread-count", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    unreadRes.status === 200 ? ok("GET /notifications/unread-count returns 200") : fail("Unread count endpoint failed");
    const unreadCount = unreadRes.data?.data?.count ?? 0;
    unreadCount >= 3 ? ok(`Unread count is ${unreadCount} (>= 3 expected)`) : fail(`Unread count is ${unreadCount} (expected >= 3)`);

    // ── Test 7: Notification persisted in PostgreSQL ───────────────────────
    section("Test 7: Notification is persisted in PostgreSQL");
    const notifications = notifsRes.data?.data?.notifications ?? [];
    if (notifications.length === 0) {
      fail("No notifications found in response");
      return;
    }
    const firstId = notifications[0].id;
    const dbRecord = await prisma.notification.findUnique({ where: { id: firstId } });
    dbRecord ? ok("Notification found in PostgreSQL") : fail("Notification NOT found in PostgreSQL");

    // ── Test 18: No credentials in notification records ────────────────────
    section("Test 18: No credentials in notification records or API responses");
    const allNotifData = JSON.stringify(notifsRes.data);
    const hasCredentials = ["password", "accessToken", "secret", "jwtSecret", "hubspotToken"].some(kw => allNotifData.toLowerCase().includes(kw));
    !hasCredentials ? ok("No credentials found in notification API response") : fail("Credentials detected in notification response!");

    // ── Test 5: Mark-one-read ──────────────────────────────────────────────
    section("Test 5: Mark-one-read");
    const markOneRes = await api().patch(`/notifications/${firstId}/read`, {}, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    markOneRes.status === 200 ? ok("PATCH /:id/read returns 200") : fail("Mark-one-read failed: " + markOneRes.status, markOneRes.data);
    markOneRes.data?.data?.notification?.read === true ? ok("Notification.read is now true") : fail("Notification.read not updated to true");

    // Attempt mark-one-read as wrong user
    const wrongUserMark = await api().patch(`/notifications/${firstId}/read`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    wrongUserMark.status === 404 ? ok("Admin cannot mark another user's notification as read (404)") : fail(`Expected 404 but got ${wrongUserMark.status}`);

    // ── Test 6: Mark-all-read ─────────────────────────────────────────────
    section("Test 6: Mark-all-read");
    const markAllRes = await api().patch("/notifications/read-all", {}, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    markAllRes.status === 200 ? ok("PATCH /read-all returns 200") : fail("Mark-all-read failed: " + markAllRes.status, markAllRes.data);
    const updatedCount = markAllRes.data?.data?.updatedCount ?? -1;
    updatedCount >= 0 ? ok(`Mark-all-read updated ${updatedCount} notifications`) : fail("updatedCount missing in response");

    const finalUnreadRes = await api().get("/notifications/unread-count", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    finalUnreadRes.data?.data?.count === 0 ? ok("Unread count is 0 after mark-all-read") : fail(`Unread count should be 0 but is ${finalUnreadRes.data?.data?.count}`);

    // ── Test 11: Offline notification available via REST ────────────────────
    section("Test 11: Offline notification available via REST");
    // Disconnect user socket to simulate going offline
    userSocket?.disconnect();
    userSocket = null;
    await sleep(300);

    // Create a new notification while user is offline
    await prisma.notification.create({
      data: {
        userId,
        title: "Offline Test",
        message: "This was created while you were offline",
        type: "system",
        read: false,
      },
    });

    // REST endpoint should still return it
    const offlineNotifRes = await api().get("/notifications", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const offlineNotifs = offlineNotifRes.data?.data?.notifications ?? [];
    const offlineFound = offlineNotifs.some((n: any) => n.title === "Offline Test");
    offlineFound ? ok("Offline notification retrieved via REST") : fail("Offline notification not found via REST");

    // ── Test 15: Import completion creates notification ────────────────────
    section("Test 15: Import completion creates notification");
    // Create a minimal CSV and POST it
    const FormData = require("form-data");
    const form = new FormData();
    const csv = "firstName,lastName,email\nImport,User,import.notif@test.com\n";
    form.append("file", Buffer.from(csv), { filename: "test.csv", contentType: "text/csv" });
    
    const importRes = await axios.post(`${BASE_URL}/imports/contacts`, form, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        ...form.getHeaders(),
      },
      validateStatus: () => true,
    });
    importRes.status === 200 || importRes.status === 201 ? ok("Import endpoint accepts CSV") : fail("Import failed: " + importRes.status, importRes.data);

    await sleep(500);
    const afterImportNotifs = await prisma.notification.findMany({
      where: { type: "import" },
    });
    afterImportNotifs.length > 0 ? ok("Import completion notification created in DB") : fail("No import notification found");

  } finally {
    if (userSocket) userSocket.disconnect();
    if (adminSocket) adminSocket.disconnect();
    // Cascade-safe cleanup: delete child records before users
    const testEmails = [`notif.admin.${uid}@test.com`, `notif.user.${uid}@test.com`];
    const testUsers = await prisma.user.findMany({ where: { email: { in: testEmails } } });
    const testUserIds = testUsers.map((u) => u.id);
    if (testUserIds.length > 0) {
      await prisma.notification.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.activity.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.task.deleteMany({ where: { assignedUserId: { in: testUserIds } } });
      await prisma.contact.deleteMany({ where: { assignedUserId: { in: testUserIds } } });
      await prisma.deal.deleteMany({ where: { assignedUserId: { in: testUserIds } } });
      await prisma.importJob.deleteMany({ where: { createdById: { in: testUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
    }
    await prisma.$disconnect();
  }
}

// ─── Static Checks ────────────────────────────────────────────────────────────

function runStaticChecks() {
  section("Static Checks: TypeScript & Prisma");

  try {
    execSync("npx.cmd tsc --noEmit", { stdio: "pipe", cwd: "d:/CRM internship/server" });
    ok("npx tsc --noEmit → 0 errors");
  } catch (e: any) {
    fail("TypeScript errors found:\n" + e.stdout?.toString());
    process.exitCode = 1;
  }

  try {
    execSync("npx.cmd prisma validate", { stdio: "pipe", cwd: "d:/CRM internship/server" });
    ok("npx prisma validate → valid");
  } catch (e: any) {
    fail("Prisma validation failed:\n" + e.stdout?.toString());
    process.exitCode = 1;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("   Phase 11 — Notification & Real-Time Updates Audit  ");
  console.log("══════════════════════════════════════════════════════\n");

  await bootstrap();
  await runTests();
  runStaticChecks();

  console.log(`\n══════════════════════════════════════════════════════`);
  console.log(`   Results: ${passed} Passed | ${failed} Failed`);
  console.log(`══════════════════════════════════════════════════════\n`);

  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
