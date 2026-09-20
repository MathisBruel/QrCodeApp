import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create super admin
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@qrapp.local' },
    update: {},
    create: {
      email: 'admin@qrapp.local',
      passwordHash: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('Super Admin created:', superAdmin.email);

  // Create test admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin2@qrapp.local' },
    update: {},
    create: {
      email: 'admin2@qrapp.local',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Admin user created:', admin.email);

  // Create test regular user
  const userPassword = await bcrypt.hash('User123!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@qrapp.local' },
    update: {},
    create: {
      email: 'user@qrapp.local',
      passwordHash: userPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      isActive: true,
    },
  });

  console.log('Test user created:', user.email);

  console.log('Seed completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
