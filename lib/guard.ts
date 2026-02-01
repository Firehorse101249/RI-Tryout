import { prisma } from "./prisma";
import { audit } from "./audit";

export async function requireCadetActive(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.lockedReason) throw new Error("LOCKED");

  const membership = await prisma.teamMember.findFirst({
    where: { userId },
    include: { team: { include: { session: true, notes: true } } }
  });
  if (!membership) throw new Error("NO_TEAM");

  const team = membership.team;
  const session = team.session;

  if (!session || session.status === "NOT_STARTED") {
    return { team, session: session || null, state: "NOT_STARTED" };
  }

  if (session.status === "ACTIVE") {
    const now = new Date();
    if (session.endsAt && now > session.endsAt) {
      // expire -> lock whole team
      await prisma.teamSession.update({
        where: { teamId: team.id },
        data: { status: "EXPIRED" }
      });

      const members = await prisma.teamMember.findMany({ where: { teamId: team.id } });
      const ids = members.map((m: any) => m.userId);

      await prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { lockedReason: "Tryout expired (4 hours elapsed). Instructor unlock required." }
      });

      await audit({ teamId: team.id, userId, type: "TRYOUT_EXPIRED_AUTOLOCK" });
      throw new Error("EXPIRED_LOCKED");
    }

    return { team, session, state: "ACTIVE" };
  }

  if (session.status === "EXPIRED") {
    throw new Error("EXPIRED_LOCKED");
  }

  throw new Error("UNKNOWN_STATE");
}
