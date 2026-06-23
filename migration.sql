import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Default Admin ────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123456', 12);
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: adminPassword,
      characterName: 'Super administrator, no assignment required',
      isEnabled: true,
    },
  });
  console.log('✅ Default admin created: admin');

  // ─── VIP Levels ───────────────────────────────────────────────────────────
  const vipLevels = [
    {
      id: 1, name: 'VIP1', sortOrder: 1,
      dailyOrderVolume: 30, taskWheel: 3,
      amountLimit: 25, lowestProductPrice: 0, highestProductPrice: 0,
      upgradeRewards: 0, pricePerGrade: 25,
      minWithdrawal: 100, maxWithdrawal: 5000,
      minRecharge: 20, maxRecharge: 1000000,
      transactionFeeRate: 0, orderCommissionRate: 0.01,
      gradeSalary: 10,
    },
    {
      id: 2, name: 'VIP2', sortOrder: 2,
      dailyOrderVolume: 40, taskWheel: 3,
      amountLimit: 1500, lowestProductPrice: 0, highestProductPrice: 0,
      upgradeRewards: 0, pricePerGrade: 1500,
      minWithdrawal: 100, maxWithdrawal: 10000,
      minRecharge: 100, maxRecharge: 1000000,
      transactionFeeRate: 0, orderCommissionRate: 0.02,
      gradeSalary: 0,
    },
    {
      id: 3, name: 'VIP3', sortOrder: 3,
      dailyOrderVolume: 50, taskWheel: 5,
      amountLimit: 5000, lowestProductPrice: 0, highestProductPrice: 0,
      upgradeRewards: 0, pricePerGrade: 5000,
      minWithdrawal: 100, maxWithdrawal: 50000,
      minRecharge: 500, maxRecharge: 1000000,
      transactionFeeRate: 0, orderCommissionRate: 0.04,
      gradeSalary: 0,
    },
    {
      id: 4, name: 'VIP4', sortOrder: 4,
      dailyOrderVolume: 60, taskWheel: 6,
      amountLimit: 10000, lowestProductPrice: 0, highestProductPrice: 0,
      upgradeRewards: 0, pricePerGrade: 10000,
      minWithdrawal: 100, maxWithdrawal: 1000000,
      minRecharge: 500, maxRecharge: 1000000,
      transactionFeeRate: 0, orderCommissionRate: 0.05,
      gradeSalary: 0,
    },
  ];

  for (const vip of vipLevels) {
    await prisma.vipLevel.upsert({
      where: { id: vip.id },
      update: vip,
      create: vip,
    });
  }
  console.log('✅ VIP levels created: VIP1-VIP4');

  // ─── Site Settings ────────────────────────────────────────────────────────
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      appName: 'Hotel Booking',
      defaultLanguage: 'en',
      timezone: 'UTC',
      openingTime: '09:00',
      closingTime: '23:58:59',
      withdrawalStartTime: '01:00',
      withdrawalEndTime: '17:00',
      registrationRewards: 0,
      rebateMultiplier: 0,
      level1CommissionRate: 0.30,
      level2CommissionRate: 0,
      level3CommissionRate: 0,
      level4CommissionRate: 0,
      level5CommissionRate: 0,
    },
  });
  console.log('✅ Site settings initialized');

  // ─── Customer Service Links ───────────────────────────────────────────────
  await prisma.customerServiceLink.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Tawk', url: 'https://tawk.to', isActive: true },
  });
  await prisma.customerServiceLink.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Telegram', url: 'https://t.me/support', isActive: true },
  });
  console.log('✅ Customer service links created');

  // ─── Sample Hotels ────────────────────────────────────────────────────────
  const sampleHotels = [
    { name: 'Wilderness Hotel Inari', price: 315, picture: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400' },
    { name: 'Alean Family Doville', price: 882, picture: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400' },
    { name: 'Trezzini Palace Hotel', price: 774, picture: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400' },
    { name: 'Akka Knibekaize Hostel', price: 669, picture: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400' },
    { name: 'Arctic TreeHouse Hotel', price: 8510, picture: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400' },
    { name: 'Hotel Chalpan', price: 475, picture: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400' },
    { name: 'Kakslauttanen Arctic Resort', price: 524, picture: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400' },
    { name: 'Golden Triangle Hotel', price: 1635, picture: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400' },
    { name: 'Grand Residenza Milano', price: 1240, picture: 'https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=400' },
    { name: 'Citrus Hotel', price: 893, picture: 'https://images.unsplash.com/photo-1630660664869-c9d3cc676880?w=400' },
  ];

  for (const hotel of sampleHotels) {
    const existing = await prisma.hotel.findFirst({ where: { name: hotel.name } });
    if (!existing) {
      await prisma.hotel.create({ data: hotel });
    }
  }
  console.log('✅ Sample hotels created');

  // ─── System invitation code (for first registration) ─────────────────────
  // Create a system user with invitation code SYSTEM that new users can use
  const systemUser = await prisma.user.findFirst({ where: { invitationCode: 'SYSTEM' } });
  if (!systemUser) {
    await prisma.user.create({
      data: {
        phone: 'system',
        nickname: 'System',
        password: await bcrypt.hash('system-no-login', 12),
        withdrawPassword: await bcrypt.hash('system-no-login', 12),
        invitationCode: 'SYSTEM',
        vipLevelId: 1,
        status: 'DISABLED',
      },
    });
  }
  console.log('✅ System invitation code: SYSTEM');

  // ─── Default multilingual content ────────────────────────────────────────
  const contents = [
    { key: 'register_message', language: 'en', content: 'Congratulations, you have successfully registered! Welcome to Hotel Booking.' },
    { key: 'system_tips', language: 'en', content: 'If you do not get a response after a long time, please contact online customer service.' },
    { key: 'faq', language: 'en', content: '<h3>Deposit</h3><p>Each deposit needs to be submitted to customer service for assistance.</p><h3>Withdraw funds</h3><p>Before withdrawing, bind your withdrawal address first.</p>' },
    { key: 'nda', language: 'en', content: 'Platform members can use referral codes to invite others. Income is 30% of the commissions earned by downline participants.' },
    { key: 'about_us', language: 'en', content: 'Hotel Booking is a hotel affiliate commission platform.' },
  ];

  for (const content of contents) {
    await prisma.multilingualContent.upsert({
      where: { key_language: { key: content.key, language: content.language } },
      update: {},
      create: content,
    });
  }
  console.log('✅ Default content created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('─────────────────────────────────');
  console.log('Admin login: admin / admin123456');
  console.log('First user invitation code: SYSTEM');
  console.log('─────────────────────────────────');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
