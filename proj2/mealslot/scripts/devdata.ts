 
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.category.findMany();
  const d = await prisma.dish.findMany({ take: 5 });
  console.log({ categories: c.length, sampleDishes: d.map((x) => x.name) });
}
main().finally(() => prisma.$disconnect());
