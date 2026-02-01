/* server.js */
const express = require("express");
const next = require("next");
const { Server } = require("socket.io");
const http = require("http");

const { prisma } = require("./lib/prisma");
const { requireAuth, issueAuthCookie, clearAuthCookie } = require("./lib/auth");
const { requireCadetActive } = require("./lib/guard");
const { audit } = require("./lib/audit");
const bcrypt = require("bcryptjs");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

function json(res, code, obj) {
  res.status(code).json(obj);
}

app.prepare().then(async () => {
  const server = express();
  server.use(express.json({ limit: "1mb" }));

  // Health
  server.get("/api/health", (req, res) => json(res, 200, { ok: true }));

  // -----------------------------
  // AUTH
  // -----------------------------
  server.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return json(res, 400, { error: "Missing credentials" });

    const user = await prisma.user.findUnique({ where: { username } });
    const ok = user && (await bcrypt.compare(password, user.passwordHash));

    if (!ok) {
      await audit({ userId: user?.id, type: "LOGIN_FAIL", payload: { username } });
      return json(res, 401, { error: "Invalid credentials" });
    }

    if (user.lockedReason) {
      await audit({ userId: user.id, type: "LOGIN_BLOCKED_LOCKED", payload: { reason: user.lockedReason } });
      return json(res, 403, { error: "Locked", lockedReason: user.lockedReason });
    }

    issueAuthCookie(res, user);
    await audit({ userId: user.id, type: "LOGIN_SUCCESS" });
    return json(res, 200, { ok: true, role: user.role });
  });

  server.post("/api/auth/logout", async (req, res) => {
    const u = requireAuth(req);
    clearAuthCookie(res);
    if (u?.id) await audit({ userId: u.id, type: "LOGOUT" });
    return json(res, 200, { ok: true });
  });

  server.get("/api/me", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 200, { user: null });
    const user = await prisma.user.findUnique({ where: { id: u.id } });
    if (!user) return json(res, 200, { user: null });
    return json(res, 200, {
      user: { id: user.id, username: user.username, role: user.role, lockedReason: user.lockedReason }
    });
  });

  // -----------------------------
  // INSTRUCTOR / ADMIN API
  // -----------------------------
  server.post("/api/instructor/create-user", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") return json(res, 403, { error: "Forbidden" });

    const { username, password, role } = req.body || {};
    if (!username || !password || !role) return json(res, 400, { error: "Missing fields" });
    if (!["CADET", "INSTRUCTOR"].includes(role)) return json(res, 400, { error: "Bad role" });

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: { username, passwordHash, role }
    });

    await audit({ userId: u.id, type: "INSTRUCTOR_CREATE_USER", payload: { createdUserId: created.id, role } });
    return json(res, 200, { ok: true, userId: created.id });
  });

  server.post("/api/instructor/create-team", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") return json(res, 403, { error: "Forbidden" });

    const { name } = req.body || {};
    const joinCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const team = await prisma.team.create({
      data: { name: name || "Team", joinCode, caseId: "PILOT_GHOST_SIGNAL" }
    });
    await prisma.teamNotes.create({ data: { teamId: team.id, content: "" } });

    await audit({ userId: u.id, type: "INSTRUCTOR_CREATE_TEAM", payload: { teamId: team.id } });
    return json(res, 200, { ok: true, team });
  });

  server.post("/api/instructor/add-to-team", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") return json(res, 403, { error: "Forbidden" });

    const { username, joinCode } = req.body || {};
    if (!username || !joinCode) return json(res, 400, { error: "Missing fields" });

    const team = await prisma.team.findUnique({ where: { joinCode } });
    if (!team) return json(res, 404, { error: "No team" });

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return json(res, 404, { error: "No user" });

    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId: user.id } },
      update: {},
      create: { teamId: team.id, userId: user.id }
    });

    await audit({ userId: u.id, type: "INSTRUCTOR_ADD_TO_TEAM", payload: { teamId: team.id, targetUserId: user.id } });
    return json(res, 200, { ok: true });
  });

  server.get("/api/instructor/teams", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") return json(res, 403, { error: "Forbidden" });

    const teams = await prisma.team.findMany({
      include: {
        members: { include: { user: true } },
        session: true
      },
      orderBy: { createdAt: "desc" }
    });
    return json(res, 200, { teams });
  });

  server.get("/api/instructor/team/:id", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") return json(res, 403, { error: "Forbidden" });

    const teamId = req.params.id;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: { include: { user: true } },
        notes: true,
        session: true,
        audits: { orderBy: { createdAt: "desc" }, take: 200 },
        submissions: { include: { user: true }, orderBy: { createdAt: "desc" } }
      }
    });
    if (!team) return json(res, 404, { error: "No team" });
    return json(res, 200, { team });
  });

  server.post("/api/instructor/unlock-team", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") return json(res, 403, { error: "Forbidden" });

    const { teamId } = req.body || {};
    if (!teamId) return json(res, 400, { error: "Missing teamId" });

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true, session: true }
    });
    if (!team) return json(res, 404, { error: "No team" });

    // Clear locks for all members
    const memberIds = team.members.map(m => m.userId);
    await prisma.user.updateMany({
      where: { id: { in: memberIds } },
      data: { lockedReason: null }
    });

    // Advance attempt number and reset session to NOT_STARTED
    const nextAttempt = (team.session?.attemptNumber ?? 0) + 1;

    await prisma.teamSession.upsert({
      where: { teamId },
      update: {
        status: "NOT_STARTED",
        attemptNumber: nextAttempt,
        startedAt: null,
        endsAt: null
      },
      create: {
        teamId,
        status: "NOT_STARTED",
        attemptNumber: 1
      }
    });

    await audit({ teamId, userId: u.id, type: "INSTRUCTOR_UNLOCK_TEAM", payload: { nextAttempt } });
    return json(res, 200, { ok: true });
  });

  server.post("/api/instructor/grade", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") return json(res, 403, { error: "Forbidden" });

    const { submissionId, score, notes } = req.body || {};
    if (!submissionId || typeof score !== "number") return json(res, 400, { error: "Missing fields" });

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: { score, instructorNotes: notes || "", gradedById: u.id, gradedAt: new Date() }
    });

    await audit({ userId: u.id, teamId: updated.teamId, type: "INSTRUCTOR_GRADE", payload: { submissionId, score } });
    return json(res, 200, { ok: true });
  });
  // List users (with team membership)
server.get("/api/instructor/users", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") return json(res, 403, { error: "Forbidden" });
  
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        lockedReason: true,
        createdAt: true,
        memberships: {
          select: {
            team: { select: { id: true, name: true, joinCode: true } }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });
  
    return json(res, 200, { users });
  });
  
  // Lock or unlock a user
  server.post("/api/instructor/user/lock", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") return json(res, 403, { error: "Forbidden" });
  
    const { userId, locked, reason } = req.body || {};
    if (!userId || typeof locked !== "boolean") return json(res, 400, { error: "Missing fields" });
  
    // Prevent locking yourself (optional safety)
    if (userId === u.id) return json(res, 400, { error: "You cannot lock your own account." });
  
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { lockedReason: locked ? (reason || "Account locked by instructor.") : null }
    });
  
    await audit({
      userId: u.id,
      type: locked ? "INSTRUCTOR_LOCK_USER" : "INSTRUCTOR_UNLOCK_USER",
      payload: { targetUserId: userId, reason: locked ? (reason || "") : "" }
    });
  
    return json(res, 200, { ok: true, user: { id: updated.id, lockedReason: updated.lockedReason } });
  });
  
  // Remove user from a team (doesn't delete user)
  server.post("/api/instructor/user/remove-from-team", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") return json(res, 403, { error: "Forbidden" });
  
    const { userId, teamId } = req.body || {};
    if (!userId || !teamId) return json(res, 400, { error: "Missing fields" });
  
    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } }
    });
  
    await audit({
      userId: u.id,
      teamId,
      type: "INSTRUCTOR_REMOVE_FROM_TEAM",
      payload: { targetUserId: userId }
    });
  
    return json(res, 200, { ok: true });
  });
  
  // Delete user (dangerous; use sparingly)
  server.post("/api/instructor/user/delete", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "ADMIN") return json(res, 403, { error: "Admin only" });
  
    const { userId } = req.body || {};
    if (!userId) return json(res, 400, { error: "Missing userId" });
  
    if (userId === u.id) return json(res, 400, { error: "You cannot delete your own account." });
  
    await prisma.user.delete({ where: { id: userId } });
  
    await audit({
      userId: u.id,
      type: "ADMIN_DELETE_USER",
      payload: { targetUserId: userId }
    });
  
    return json(res, 200, { ok: true });
  });
  

  // -----------------------------
  // CADET API
  // -----------------------------
  server.get("/api/cadet/team", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });

    const member = await prisma.teamMember.findFirst({
      where: { userId: u.id },
      include: { team: { include: { session: true } } }
    });
    if (!member) return json(res, 200, { team: null });

    return json(res, 200, {
      team: {
        id: member.team.id,
        name: member.team.name,
        caseId: member.team.caseId,
        session: member.team.session
      }
    });
  });

  server.post("/api/cadet/start", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "CADET") return json(res, 403, { error: "Forbidden" });

    const user = await prisma.user.findUnique({ where: { id: u.id } });
    if (user.lockedReason) return json(res, 403, { error: "Locked", lockedReason: user.lockedReason });

    const member = await prisma.teamMember.findFirst({ where: { userId: u.id } });
    if (!member) return json(res, 400, { error: "No team" });

    const teamId = member.teamId;
    const session = await prisma.teamSession.findUnique({ where: { teamId } });

    if (session && session.status === "ACTIVE") {
      await audit({ teamId, userId: u.id, type: "TRYOUT_START_JOIN_ACTIVE" });
      return json(res, 200, { ok: true, session });
    }

    // start (or restart if NOT_STARTED)
    const now = new Date();
    const endsAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const attemptNumber = session?.attemptNumber ?? 1;
    const newSession = await prisma.teamSession.upsert({
      where: { teamId },
      update: { status: "ACTIVE", startedAt: now, endsAt },
      create: { teamId, status: "ACTIVE", startedAt: now, endsAt, attemptNumber: 1 }
    });

    await audit({ teamId, userId: u.id, type: "TRYOUT_STARTED", payload: { endsAt: newSession.endsAt } });
    return json(res, 200, { ok: true, session: newSession });
  });

  server.get("/api/cadet/status", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "CADET") return json(res, 403, { error: "Forbidden" });

    try {
      const status = await requireCadetActive(u.id); // also expires/locks if needed
      return json(res, 200, status);
    } catch (e) {
      return json(res, 403, { error: String(e.message || e) });
    }
  });

  server.post("/api/cadet/submit", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "CADET") return json(res, 403, { error: "Forbidden" });

    let status;
    try {
      status = await requireCadetActive(u.id);
    } catch (e) {
      return json(res, 403, { error: String(e.message || e) });
    }

    const { answers } = req.body || {};
    if (!answers || typeof answers !== "object") return json(res, 400, { error: "Missing answers" });

    const submission = await prisma.submission.create({
      data: {
        teamId: status.team.id,
        userId: u.id,
        attemptNumber: status.session.attemptNumber,
        answersJson: answers
      }
    });

    await audit({ teamId: status.team.id, userId: u.id, type: "FINAL_SUBMITTED", payload: { submissionId: submission.id } });
    return json(res, 200, { ok: true });
  });

  // -----------------------------
  // SOCKET.IO (Co-op notes)
  // -----------------------------
  const httpServer = http.createServer(server);
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: true, credentials: true }
  });

  io.on("connection", (socket) => {
    socket.on("team:join", async ({ teamId }) => {
      if (!teamId) return;
      socket.join(`team:${teamId}`);
    });

    socket.on("notes:update", async ({ teamId, userId, content }) => {
      if (!teamId || !userId) return;
      if (typeof content !== "string") return;

      // store
      await prisma.teamNotes.update({
        where: { teamId },
        data: { content, updatedAt: new Date() }
      });

      await audit({ teamId, userId, type: "NOTE_EDITED", payload: { length: content.length } });

      // broadcast
      io.to(`team:${teamId}`).emit("notes:sync", { content });
    });
  });

  // Next handler
  server.all("*", (req, res) => handle(req, res));

  httpServer.listen(PORT, () => {
    console.log(`Server listening on :${PORT}`);
  });
});
