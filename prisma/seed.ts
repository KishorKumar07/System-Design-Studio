import { PrismaClient } from "@prisma/client";
import { PROBLEMS } from "./problems.data";

const prisma = new PrismaClient();

async function main() {
  for (const p of PROBLEMS) {
    const data = {
      ...p,
      functionalRequirements: [...p.functionalRequirements],
      nonFunctionalRequirements: [...p.nonFunctionalRequirements],
      constraints: [...p.constraints],
    };
    await prisma.problem.upsert({
      where: { slug: p.slug },
      update: data,
      create: data,
    });
  }
  console.log(`Seeded ${PROBLEMS.length} problems.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
