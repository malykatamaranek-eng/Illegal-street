import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Admin credentials as specified
  const admins = [
    {
      email: 'vitalik@illegal-street.io',
      username: 'vitalik_admin',
      password: 'V1t@l1k_Secure#2024!',
      role: 'SUPER_ADMIN' as const,
    },
    {
      email: 'developer@illegal-street.io',
      username: 'dev_admin',
      password: 'Dev3l0per_Safe@456!',
      role: 'ADMIN' as const,
    },
    {
      email: 'blazej@illegal-street.io',
      username: 'blazej_admin',
      password: 'Bl@zej_Fortress#789!',
      role: 'ADMIN' as const,
    },
  ];

  // Create admin users
  for (const admin of admins) {
    console.log(`Creating admin user: ${admin.username}...`);

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: admin.email }, { username: admin.username }],
      },
    });

    if (existing) {
      console.log(`  ⚠️  User ${admin.username} already exists, skipping...`);
      continue;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(admin.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: admin.email,
        username: admin.username,
        passwordHash,
        level: 10,
        totalPoints: 10000,
      },
    });

    // Create admin role
    await prisma.admin.create({
      data: {
        userId: user.id,
        role: admin.role,
        permissions: {
          users: ['read', 'create', 'update', 'delete'],
          modules: ['read', 'create', 'update', 'delete'],
          products: ['read', 'create', 'update', 'delete'],
          orders: ['read', 'update'],
          chat: ['read', 'delete', 'moderate'],
        },
      },
    });

    console.log(`  ✅ Admin user ${admin.username} created successfully!`);
  }

  // Seed sample modules
  console.log('\n📚 Creating sample modules...');
  
  const modules = [
    {
      title: 'Introduction to Cybersecurity',
      description: 'Learn the basics of cybersecurity and common threats',
      category: 'Security',
      difficulty: 'BEGINNER' as const,
      points: 100,
      content: 'This module covers the fundamentals of cybersecurity...',
    },
    {
      title: 'Web Application Security',
      description: 'Understanding and preventing web vulnerabilities',
      category: 'Security',
      difficulty: 'INTERMEDIATE' as const,
      points: 200,
      content: 'Learn about XSS, CSRF, SQL Injection and more...',
    },
    {
      title: 'Network Security Fundamentals',
      description: 'Basics of network security and protocols',
      category: 'Network',
      difficulty: 'INTERMEDIATE' as const,
      points: 150,
      content: 'Understanding TCP/IP, firewalls, and network defense...',
    },
    {
      title: 'Cryptography Essentials',
      description: 'Introduction to encryption and cryptographic systems',
      category: 'Cryptography',
      difficulty: 'ADVANCED' as const,
      points: 250,
      content: 'Symmetric and asymmetric encryption, hashing algorithms...',
    },
  ];

  for (const moduleData of modules) {
    const existing = await prisma.module.findFirst({
      where: { title: moduleData.title },
    });

    if (!existing) {
      const module = await prisma.module.create({
        data: moduleData,
      });

      // Create sample courses for each module
      await prisma.course.createMany({
        data: [
          {
            moduleId: module.id,
            lessonNumber: 1,
            title: 'Introduction',
            content: 'Welcome to this module...',
            duration: 15,
          },
          {
            moduleId: module.id,
            lessonNumber: 2,
            title: 'Core Concepts',
            content: 'Let\'s dive into the key concepts...',
            duration: 30,
          },
          {
            moduleId: module.id,
            lessonNumber: 3,
            title: 'Practical Examples',
            content: 'Now let\'s look at real-world examples...',
            duration: 45,
          },
        ],
      });

      // Create sample quiz
      await prisma.quiz.create({
        data: {
          moduleId: module.id,
          title: `${moduleData.title} - Quiz`,
          questions: [
            {
              question: 'What is the primary goal of cybersecurity?',
              options: [
                'Make systems faster',
                'Protect systems and data',
                'Create new software',
                'Delete old files',
              ],
              correctAnswer: 1,
            },
            {
              question: 'Which of the following is a common security threat?',
              options: ['Phishing', 'Printing', 'Reading', 'Writing'],
              correctAnswer: 0,
            },
          ],
        },
      });

      console.log(`  ✅ Module "${moduleData.title}" created`);
    }
  }

  // Seed product categories
  console.log('\n🏪 Creating product categories...');
  
  const categories = [
    { name: 'Books', description: 'Cybersecurity and programming books' },
    { name: 'Courses', description: 'Premium online courses' },
    { name: 'Tools', description: 'Security tools and software' },
    { name: 'Merchandise', description: 'Branded merchandise and apparel' },
  ];

  for (const category of categories) {
    const existing = await prisma.productCategory.findFirst({
      where: { name: category.name },
    });

    if (!existing) {
      await prisma.productCategory.create({ data: category });
      console.log(`  ✅ Category "${category.name}" created`);
    }
  }

  // Seed sample products
  console.log('\n🛍️  Creating sample products...');
  
  const booksCategory = await prisma.productCategory.findFirst({
    where: { name: 'Books' },
  });

  if (booksCategory) {
    const products = [
      {
        name: 'The Art of Exploitation',
        description: 'A comprehensive guide to hacking techniques',
        price: 49.99,
        categoryId: booksCategory.id,
        stock: 25,
      },
      {
        name: 'Web Security Handbook',
        description: 'Essential guide to web application security',
        price: 39.99,
        categoryId: booksCategory.id,
        stock: 30,
      },
    ];

    for (const product of products) {
      const existing = await prisma.product.findFirst({
        where: { name: product.name },
      });

      if (!existing) {
        await prisma.product.create({ data: product });
        console.log(`  ✅ Product "${product.name}" created`);
      }
    }
  }

  console.log('\n✨ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
