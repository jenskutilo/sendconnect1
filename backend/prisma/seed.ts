import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';

  // Erstelle Admin-User
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  console.log('Admin-User erstellt:', admin.email);

  // Erstelle Standard-Einstellungen
  await prisma.setting.upsert({
    where: { key: 'default_from_name' },
    update: {},
    create: {
      key: 'default_from_name',
      value: process.env.DEFAULT_FROM_NAME || 'SendConnect',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'default_from_email' },
    update: {},
    create: {
      key: 'default_from_email',
      value: process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'global_rate_limit' },
    update: {},
    create: {
      key: 'global_rate_limit',
      value: 1000, // Mails pro Stunde
    },
  });

  console.log('Standard-Einstellungen erstellt');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

