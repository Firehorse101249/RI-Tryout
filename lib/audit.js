const { prisma } = require("./prisma");

async function audit(opts) {
  const { type, teamId, userId, payload } = opts;
  await prisma.auditEvent.create({
    data: { type, teamId, userId, payload: payload ?? undefined }
  });
}

module.exports = { audit };
