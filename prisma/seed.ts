import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const ADMIN_EMAIL = "admin.panel@artecho.com";
  const ADMIN_PASSWORD = "Artech0#9482";
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.user.deleteMany({
    where: {
      email: { in: ["admin@artecho.com"] },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      role: "ADMIN",
      name: "ArtEcho Admin",
      passwordHash: adminHash,
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      name: "ArtEcho Admin",
      role: "ADMIN",
      plans: {
        create: { tier: "CREATOR", status: "ACTIVE" },
      },
    },
  });
  await prisma.plan.updateMany({
    where: { userId: admin.id, status: "ACTIVE" },
    data: { status: "SUSPENDED" },
  });
  await prisma.plan.create({
    data: {
      userId: admin.id,
      tier: "CREATOR",
      status: "ACTIVE",
      startDate: new Date(),
    },
  });
  console.log("Admin created:", admin.email);

  const userHash = await bcrypt.hash("demo123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@artecho.com" },
    update: {},
    create: {
      email: "demo@artecho.com",
      passwordHash: userHash,
      name: "Demo User",
      role: "USER",
      plans: {
        create: {
          tier: "BASIC",
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });
  console.log("Demo user created:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
