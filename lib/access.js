const { prisma } = require("./prisma");

async function getAccessGrantForUser(teamId, attemptNumber, userId) {
  const g = await prisma.accessGrant.findUnique({
    where: { teamId_attemptNumber_userId: { teamId, attemptNumber, userId } }
  });
  return g || null;
}

module.exports = { getAccessGrantForUser };
