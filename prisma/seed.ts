import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.booking.deleteMany();
  await prisma.location.deleteMany();

  await prisma.location.createMany({
    data: [
      {
        name: "Sunset Cove Launch",
        address: "142 Sunset Cove Rd, Lakeside",
        kayakCount: 8,
      },
      {
        name: "Harbor Marina Dock",
        address: "9 Harbor Marina Way, Lakeside",
        kayakCount: 6,
      },
      {
        name: "Pine Point Beach",
        address: "300 Pine Point Dr, Lakeside",
        kayakCount: 4,
      },
    ],
  });

  console.log("Seeded locations.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
