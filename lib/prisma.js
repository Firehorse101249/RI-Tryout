// /lib/prisma.js
const { PrismaClient } = require("@prisma/client");

const globalForPrisma = global;

// create (or reuse) the client
const prisma = globalForPrisma.prisma || new PrismaClient();

// cache in dev so hot reload doesn’t spawn tons of clients
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ✅ log AFTER prisma exists
console.log("PRISMA IS:", prisma ? "OK" : "UNDEFINED");

module.exports = { prisma };
