import { PrismaClient } from "@prisma/client";

// tells TypeScript that global.prisma exists
declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

// In dev, hot reload re-runs this file on every save. Storing the client on `global` (which survives reloads)
// reuses one database connection instead of opening a new one each time.
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export { prisma };
