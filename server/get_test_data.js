const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const camp = await prisma.campaign.findFirst({ select: { id: true }});
  const user = await prisma.user.findFirst({ select: { id: true, email: true }});
  console.log('Campaign: ', camp);
  console.log('User: ', user);
  
  if (!camp) {
    // Create a dummy campaign if none exist for test
    const newCamp = await prisma.campaign.create({
      data: {
        name: "Test Audit Campaign",
        subject: "Phase 13E Real Delivery Test",
        content: "<p>This is a real test email.</p>",
        ownerId: user.id
      }
    });
    console.log('Created new Campaign: ', newCamp);
  } else {
    // Update it to make sure it has required fields
    await prisma.campaign.update({
      where: { id: camp.id },
      data: {
        subject: "Phase 13E Verification",
        content: "<p>Test Content</p>"
      }
    });
  }

  // Find a contact email
  const contact = await prisma.contact.findFirst({ select: { id: true, email: true }});
  console.log('Contact: ', contact);

  await prisma.$disconnect();
}
main().catch(console.error);
