const { prisma } = require("./prisma");

async function audit({ teamId, userId, type, payload }) {
  try {
    // Build data object safely
    const data = {
      type,
      payload: payload ?? undefined,
      userId: userId ?? undefined,
      teamId: teamId ?? undefined
    };

    // Optional: if teamId was provided, ensure it exists
    if (teamId) {
      const exists = await prisma.team.findUnique({ where: { id: teamId } });
      if (!exists) delete data.teamId;
    }

    await prisma.auditEvent.create({ data });
  } catch (e) {
    // NEVER crash the app because of audit logging
    console.error("AUDIT FAIL:", e?.code || e, e?.message || e);
  }
}

module.exports = { audit };
