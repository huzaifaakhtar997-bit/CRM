import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultPipelineStages = [
  {
    name: "Lead",
    order: 1,
    probability: 20,
    color: "#94a3b8", // Slate
    description: "Initial lead captured, unverified fit",
    isWon: false,
    isLost: false,
  },
  {
    name: "Qualified",
    order: 2,
    probability: 50,
    color: "#3b82f6", // Blue
    description: "Vetted lead with confirmed budget & interest",
    isWon: false,
    isLost: false,
  },
  {
    name: "Proposal Sent",
    order: 3,
    probability: 75,
    color: "#8b5cf6", // Purple
    description: "Formal offer or proposal delivered to prospect",
    isWon: false,
    isLost: false,
  },
  {
    name: "Negotiation",
    order: 4,
    probability: 85,
    color: "#f59e0b", // Amber
    description: "Contract and terms under active negotiation",
    isWon: false,
    isLost: false,
  },
  {
    name: "Won",
    order: 5,
    probability: 100,
    color: "#10b981", // Emerald
    description: "Deal closed and won successfully",
    isWon: true,
    isLost: false,
  },
  {
    name: "Lost",
    order: 6,
    probability: 0,
    color: "#ef4444", // Red
    description: "Deal closed and lost to competitor or cancelled",
    isWon: false,
    isLost: true,
  },
];

async function main() {
  console.log("🌱 Starting database seeding...");

  for (const stage of defaultPipelineStages) {
    const upsertedStage = await prisma.pipelineStage.upsert({
      where: { name: stage.name },
      update: {
        order: stage.order,
        probability: stage.probability,
        color: stage.color,
        description: stage.description,
        isWon: stage.isWon,
        isLost: stage.isLost,
      },
      create: stage,
    });

    console.log(
      `  [Stage] ${upsertedStage.order}. ${upsertedStage.name} (${upsertedStage.probability}%) - Created/Updated`
    );
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
