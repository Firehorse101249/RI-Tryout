// lib/prisma.js
const { PrismaClient } = require("@prisma/client");

// Prevent hot-reload from creating extra clients in dev
const globalForPrisma = global;

const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

module.exports = { prisma };
