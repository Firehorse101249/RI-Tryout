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

  server.get("/api/cadet/case-slice", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
  
    const member = await prisma.teamMember.findFirst({
      where: { userId: u.id },
      include: { team: { include: { session: true } } }
    });
    if (!member) return json(res, 400, { error: "No team" });
  
    const session = member.team.session;
    if (!session || session.status !== "ACTIVE") {
      return json(res, 403, { error: "Tryout not active" });
    }
  
    const grant = await prisma.accessGrant.findUnique({
      where: {
        teamId_attemptNumber_userId: {
          teamId: member.teamId,
          attemptNumber: session.attemptNumber,
          userId: u.id
        }
      }
    });
  
    if (!grant) return json(res, 403, { error: "No access grant" });
  
    const { kind } = req.query;
    if (!["evidence", "people", "locations"].includes(kind)) {
      return json(res, 400, { error: "Invalid kind" });
    }
  
    const { CASE } = require("./lib/caseData");
  
    const source =
      kind === "evidence"
        ? CASE.evidence
        : kind === "people"
        ? CASE.people
        : CASE.locations;
  
    const items = source.filter(
      (_, idx) => idx % grant.bucketCount === grant.bucketIndex
    );
  
    await audit({
      teamId: member.teamId,
      userId: u.id,
      type: "CADET_VIEW_SLICE",
      payload: { kind, count: items.length }
    });
  
    return json(res, 200, {
      bucketIndex: grant.bucketIndex,
      bucketCount: grant.bucketCount,
      items
    });
  });
  

  server.get("/api/cadet/dashboard", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
  
    const membership = await prisma.teamMember.findFirst({
      where: { userId: u.id },
      include: { team: { include: { session: true } } }
    });
  
    if (!membership) return json(res, 200, { hasTeam: false });
  
    const team = membership.team;
    const attempt = team.session?.attemptNumber || 1;
  
    const sub = await prisma.submission.findFirst({
      where: { teamId: team.id, userId: u.id, attemptNumber: attempt },
      orderBy: { createdAt: "desc" }
    });
  
    return json(res, 200, {
      hasTeam: true,
      team: { id: team.id, name: team.name },
      attempt,
      submission: sub
    });
  });  

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
    if (!["CADET", "INSTRUCTOR", "ADMIN"].includes(role)) return json(res, 400, { error: "Bad role" });

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

  server.get("/api/cadet/note-entries", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
  
    const membership = await prisma.teamMember.findFirst({ where: { userId: u.id } });
    if (!membership) return json(res, 400, { error: "No team" });
  
    const entries = await prisma.noteEntry.findMany({
      where: { teamId: membership.teamId },
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  
    return json(res, 200, { entries });
  });
  
  server.post("/api/instructor/delete-team", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") return json(res, 403, { error: "Forbidden" });
  
    const { teamId } = req.body || {};
    if (!teamId) return json(res, 400, { error: "Missing teamId" });
  
    await prisma.team.delete({ where: { id: teamId } });
    await audit({ userId: u.id, teamId, type: "INSTRUCTOR_DELETE_TEAM" });
  
    return json(res, 200, { ok: true });
  });
  
  server.post("/api/instructor/set-user-team", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") return json(res, 403, { error: "Forbidden" });
  
    const { userId, teamId } = req.body || {};
    if (!userId) return json(res, 400, { error: "Missing userId" });
  
    // Remove from all teams first (you can change this to only remove from one)
    await prisma.teamMember.deleteMany({ where: { userId } });
  
    if (teamId) {
      await prisma.teamMember.create({ data: { userId, teamId } });
      await audit({ userId: u.id, teamId, type: "INSTRUCTOR_ASSIGN_TEAM", payload: { targetUserId: userId } });
    } else {
      await audit({ userId: u.id, type: "INSTRUCTOR_REMOVE_FROM_TEAMS", payload: { targetUserId: userId } });
    }
  
    return json(res, 200, { ok: true });
  });
  
  server.post("/api/instructor/set-user-lock", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") return json(res, 403, { error: "Forbidden" });
  
    const { userId, lockedReason } = req.body || {};
    if (!userId) return json(res, 400, { error: "Missing userId" });
  
    await prisma.user.update({
      where: { id: userId },
      data: { lockedReason: lockedReason || null }
    });
  
    await audit({
      userId: u.id,
      type: "INSTRUCTOR_SET_USER_LOCK",
      payload: { targetUserId: userId, lockedReason: lockedReason || null }
    });
  
    return json(res, 200, { ok: true });
  });
  
  server.post("/api/instructor/delete-user", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
    if (u.role !== "INSTRUCTOR" && u.role !== "ADMIN") {
      return json(res, 403, { error: "Forbidden" });
    }
  
    const { userId } = req.body || {};
    if (!userId) return json(res, 400, { error: "Missing userId" });
  
    // Optional safety: prevent self-deletion
    if (userId === u.id) {
      return json(res, 400, { error: "You cannot delete your own account" });
    }
  
    await prisma.user.delete({ where: { id: userId } });
  
    await audit({
      userId: u.id,
      type: "INSTRUCTOR_DELETE_USER",
      payload: { targetUserId: userId }
    });
  
    return json(res, 200, { ok: true });
  });
  
  

  server.post("/api/cadet/note-entry", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
  
    const membership = await prisma.teamMember.findFirst({ where: { userId: u.id } });
    if (!membership) return json(res, 400, { error: "No team" });
  
    const { text } = req.body || {};
    if (typeof text !== "string" || !text.trim()) return json(res, 400, { error: "Empty" });
  
    await prisma.noteEntry.create({
      data: { teamId: membership.teamId, userId: u.id, text: text.trim() }
    });
  
    await prisma.auditEvent.create({
      data: {
        teamId: membership.teamId,
        userId: u.id,
        type: "CADET_NOTE_ENTRY",
        payload: { len: text.trim().length }
      }
    });
  
    return json(res, 200, { ok: true });
  });

  server.post("/api/cadet/view", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
  
    const membership = await prisma.teamMember.findFirst({ where: { userId: u.id } });
    if (!membership) return json(res, 400, { error: "No team" });
  
    const { kind, id } = req.body || {};
    if (!kind || !id) return json(res, 400, { error: "Missing fields" });
  
    await prisma.auditEvent.create({
      data: {
        teamId: membership.teamId,
        userId: u.id,
        type: "CADET_VIEW",
        payload: { kind, id }
      }
    });
  
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
  submissions: { include: { user: true }, orderBy: { createdAt: "desc" } },
  audits: {
    include: { user: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
    take: 200
  }
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
      data: {
        score: Math.max(0, Math.min(100, Math.floor(score))),
        instructorNotes: (typeof notes === "string" ? notes : "") || "",
        gradedById: u.id,
        gradedAt: new Date()
      }
      
    });

    await audit({
        userId: u.id,
        teamId: updated.teamId,
        type: "INSTRUCTOR_GRADE",
        payload: {
          submissionId,
          targetUserId: updated.userId,
          score: updated.score,
          instructorNotes: updated.instructorNotes
        }
      });
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

  // Get team notes
server.get("/api/cadet/notes", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
  
    const membership = await prisma.teamMember.findFirst({
      where: { userId: u.id }
    });
    if (!membership) return json(res, 400, { error: "No team" });
  
    const row = await prisma.teamNotes.findUnique({ where: { teamId: membership.teamId } });
    return json(res, 200, { content: row?.content || "" });
  });
  
  // Save team notes
  server.post("/api/cadet/notes", async (req, res) => {
    const u = requireAuth(req);
    if (!u) return json(res, 401, { error: "Unauthorized" });
  
    const membership = await prisma.teamMember.findFirst({
      where: { userId: u.id }
    });
    if (!membership) return json(res, 400, { error: "No team" });
  
    const { content } = req.body || {};
    if (typeof content !== "string") return json(res, 400, { error: "Invalid content" });
  
    await prisma.teamNotes.upsert({
      where: { teamId: membership.teamId },
      update: { content, updatedAt: new Date() },
      create: { teamId: membership.teamId, content }
    });
  
    await prisma.auditEvent.create({
      data: {
        teamId: membership.teamId,
        userId: u.id,
        type: "CADET_NOTES_SAVE",
        payload: { len: content.length }
      }
    });
  
    return json(res, 200, { ok: true });
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

    const attemptNumber = newSession.attemptNumber;
    const newSession = await prisma.teamSession.upsert({
      where: { teamId },
      update: { status: "ACTIVE", startedAt: now, endsAt },
      create: { teamId, status: "ACTIVE", startedAt: now, endsAt, attemptNumber: 1 }
    });

      // -----------------------------
  // ACCESS GRANT ASSIGNMENT (intel split)
  // -----------------------------
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    orderBy: { userId: "asc" } // stable order so it's fair
  });

  const bucketCount = Math.max(1, members.length);

  for (let i = 0; i < members.length; i++) {
    await prisma.accessGrant.upsert({
      where: {
        teamId_attemptNumber_userId: {
          teamId,
          attemptNumber,
          userId: members[i].userId
        }
      },
      update: {
        bucketIndex: i % bucketCount,
        bucketCount
      },
      create: {
        teamId,
        attemptNumber,
        userId: members[i].userId,
        bucketIndex: i % bucketCount,
        bucketCount
      }
    });
  }

  await audit({
    teamId,
    userId: u.id,
    type: "ACCESS_BUCKETS_ASSIGNED",
    payload: {
      attemptNumber,
      bucketCount,
      members: members.length
    }
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
