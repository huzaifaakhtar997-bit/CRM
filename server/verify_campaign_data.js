const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Campaign details
  const campaign = await prisma.campaign.findUnique({
    where: { id: 'cmsiqgzv20004in6zugfhvnhe' },
    select: { id: true, name: true, subject: true, status: true, content: true }
  });
  console.log('\n=== Campaign ===');
  console.log(JSON.stringify(campaign, null, 2));

  // Find contacts that have real email addresses
  const contactsWithEmail = await prisma.contact.findMany({
    where: { email: { not: null } },
    select: { id: true, email: true, firstName: true, lastName: true },
    take: 5
  });
  console.log('\n=== Contacts with Emails (first 5) ===');
  console.log(JSON.stringify(contactsWithEmail, null, 2));

  // Current recipients for this campaign
  const recipients = await prisma.campaignRecipient.findMany({
    where: { campaignId: 'cmsiqgzv20004in6zugfhvnhe' },
    select: { id: true, status: true, providerMessageId: true, errorMessage: true, sentAt: true, contactId: true }
  });
  console.log('\n=== Campaign Recipients ===');
  console.log(JSON.stringify(recipients.map(r => ({
    ...r,
    providerMessageId: r.providerMessageId ? 'PRESENT' : 'NULL'
  })), null, 2));

  // Admin user with real email for test-send target
  const adminUser = await prisma.user.findFirst({ 
    where: { role: 'ADMIN', email: { not: { endsWith: '@crm.test' } } },
    select: { id: true, email: true }
  });
  console.log('\n=== Admin User (for test-send target) ===');
  console.log(JSON.stringify(adminUser, null, 2));

  await prisma.$disconnect();
}
main().catch(console.error);
