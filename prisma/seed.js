const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_ADMIN_USER || "admin";
  const password = process.env.SEED_ADMIN_PASS || "admin12345";

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log("Seed admin already exists:", username);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, passwordHash, role: "ADMIN" }
  });

  console.log("Seeded admin:", username);
  console.log("IMPORTANT: change password after first login.");
}

main().finally(async () => prisma.$disconnect());
