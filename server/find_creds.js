require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const p = new PrismaClient();

async function main() {
  // Find all ADMIN and MARKETING users
  const users = await p.user.findMany({
    where: { role: { in: ['ADMIN', 'MARKETING'] } },
    select: { email: true, id: true, role: true, passwordHash: true },
    take: 20
  });

  const testPasswords = [
    'Password123!', 'password123', 'admin123', 'Admin123!',
    'password', '123456', 'admin', 'test123', 'crm123'
  ];

  for (const user of users) {
    for (const pw of testPasswords) {
      const match = await bcrypt.compare(pw, user.passwordHash);
      if (match) {
        console.log(`MATCH: email=${user.email} role=${user.role} pw=${pw}`);
        const secret = process.env.JWT_SECRET;
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          secret,
          { expiresIn: '1h' }
        );
        console.log('JWT:', token);
        await p.$disconnect();
        return;
      }
    }
  }

  // No match - generate a direct JWT for admin
  const admin = users.find(u => u.role === 'ADMIN');
  if (admin) {
    console.log('No password match found, generating direct JWT for admin:', admin.email);
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      secret,
      { expiresIn: '1h' }
    );
    console.log('Direct JWT:', token);
  }

  await p.$disconnect();
}
main().catch(console.error);
