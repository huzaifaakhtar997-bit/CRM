const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const acts = await p.activity.findMany({
    where: { type: 'EMAIL' },
    orderBy: { createdAt: 'desc' },
    take: 3
  });
  console.log(JSON.stringify(acts, null, 2));
  await p.$disconnect();
}
main();
