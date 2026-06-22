import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Super Admin
  const adminPassword = await argon2.hash('Admin@123456');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurantos.com' },
    update: {},
    create: {
      email: 'admin@restaurantos.com',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      platformRole: 'SUPER_ADMIN',
      emailVerified: true,
    },
  });
  console.log(`Created super admin: ${admin.email}`);

  // Create a demo restaurant owner
  const ownerPassword = await argon2.hash('Owner@123456');
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      email: 'owner@demo.com',
      passwordHash: ownerPassword,
      firstName: 'Demo',
      lastName: 'Owner',
      emailVerified: true,
    },
  });
  console.log(`Created demo owner: ${owner.email}`);

  // Create a demo restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'spice-garden' },
    update: {},
    create: {
      name: 'Spice Garden',
      slug: 'spice-garden',
      description: 'Authentic Indian cuisine with a modern twist',
      phone: '+91-9876543210',
      email: 'info@spicegarden.com',
      address: '123 Food Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      currency: 'INR',
      taxRate: 5,
      openingTime: '11:00',
      closingTime: '23:00',
      members: {
        create: {
          userId: owner.id,
          role: 'OWNER',
        },
      },
    },
  });
  console.log(`Created restaurant: ${restaurant.name}`);

  // Create tables
  const tables = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.table.upsert({
        where: {
          restaurantId_number: {
            restaurantId: restaurant.id,
            number: i + 1,
          },
        },
        update: {},
        create: {
          restaurantId: restaurant.id,
          number: i + 1,
          name: `Table ${i + 1}`,
          capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
        },
      }),
    ),
  );
  console.log(`Created ${tables.length} tables`);

  // Create categories
  const categories = [
    { name: 'Starters', slug: 'starters', sortOrder: 1 },
    { name: 'Main Course', slug: 'main-course', sortOrder: 2 },
    { name: 'Beverages', slug: 'beverages', sortOrder: 3 },
    { name: 'Desserts', slug: 'desserts', sortOrder: 4 },
    { name: 'Thalis', slug: 'thalis', sortOrder: 5 },
  ];

  const createdCategories = await Promise.all(
    categories.map((cat) =>
      prisma.category.upsert({
        where: {
          restaurantId_slug: {
            restaurantId: restaurant.id,
            slug: cat.slug,
          },
        },
        update: {},
        create: {
          restaurantId: restaurant.id,
          ...cat,
        },
      }),
    ),
  );
  console.log(`Created ${createdCategories.length} categories`);

  // Create sample menu items
  const startersCategory = createdCategories.find((c) => c.slug === 'starters')!;
  const mainCategory = createdCategories.find((c) => c.slug === 'main-course')!;
  const beveragesCategory = createdCategories.find((c) => c.slug === 'beverages')!;

  const menuItems = [
    {
      name: 'Paneer Tikka',
      description: 'Marinated cottage cheese grilled in tandoor',
      price: 249,
      categoryId: startersCategory.id,
      vegType: 'VEG' as const,
      spiceLevel: 'MEDIUM' as const,
      prepTime: 15,
      isRecommended: true,
    },
    {
      name: 'Chicken 65',
      description: 'Spicy deep-fried chicken with curry leaves',
      price: 299,
      categoryId: startersCategory.id,
      vegType: 'NON_VEG' as const,
      spiceLevel: 'HOT' as const,
      prepTime: 12,
      isBestseller: true,
    },
    {
      name: 'Dal Makhani',
      description: 'Slow-cooked black lentils in creamy tomato gravy',
      price: 219,
      categoryId: mainCategory.id,
      vegType: 'VEG' as const,
      spiceLevel: 'MILD' as const,
      prepTime: 20,
      isBestseller: true,
    },
    {
      name: 'Butter Chicken',
      description: 'Tender chicken in rich buttery tomato sauce',
      price: 349,
      categoryId: mainCategory.id,
      vegType: 'NON_VEG' as const,
      spiceLevel: 'MEDIUM' as const,
      prepTime: 20,
      isRecommended: true,
      isBestseller: true,
    },
    {
      name: 'Masala Chai',
      description: 'Traditional spiced Indian tea',
      price: 49,
      categoryId: beveragesCategory.id,
      vegType: 'VEG' as const,
      spiceLevel: 'NONE' as const,
      prepTime: 5,
    },
    {
      name: 'Mango Lassi',
      description: 'Creamy yogurt drink with fresh mango',
      price: 99,
      categoryId: beveragesCategory.id,
      vegType: 'VEG' as const,
      spiceLevel: 'NONE' as const,
      prepTime: 3,
      isRecommended: true,
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        ...item,
      },
    });
  }
  console.log(`Created ${menuItems.length} menu items`);

  // Create subscription plans
  const plans = [
    {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small restaurants',
      priceMonthly: 999,
      priceYearly: 9990,
      maxTables: 5,
      maxStaff: 2,
      features: ['QR Ordering', 'Basic Menu', 'Order Management'],
      sortOrder: 1,
    },
    {
      name: 'Growth',
      slug: 'growth',
      description: 'For growing restaurants',
      priceMonthly: 1999,
      priceYearly: 19990,
      maxTables: 20,
      maxStaff: 5,
      features: ['Everything in Starter', 'KDS', 'Analytics', 'Offers', 'Multiple Staff'],
      sortOrder: 2,
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'For established restaurants',
      priceMonthly: 3999,
      priceYearly: 39990,
      maxTables: null,
      maxStaff: null,
      features: [
        'Everything in Growth',
        'Unlimited Tables',
        'Unlimited Staff',
        'Advanced Analytics',
        'Priority Support',
        'Multi-location',
      ],
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
  }
  console.log(`Created ${plans.length} subscription plans`);

  console.log('\nSeed completed successfully!');
  console.log('\nDemo accounts:');
  console.log('  Super Admin: admin@restaurantos.com / Admin@123456');
  console.log('  Restaurant Owner: owner@demo.com / Owner@123456');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
