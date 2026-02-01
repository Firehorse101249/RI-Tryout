import { prisma } from "./prisma";

export async function audit(opts: {
  type: string;
  teamId?: string;
  userId?: string;
  payload?: any;
}) {
  const { type, teamId, userId, payload } = opts;
  await prisma.auditEvent.create({
    data: { type, teamId, userId, payload: payload ?? undefined }
  });
}
