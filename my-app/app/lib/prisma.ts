import { PrismaClient } from "@prisma/client";

// type global.prisma
declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

// reuse one client across dev hot reloads
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export { prisma };
