/**
 * GestionCursos & SpaceFlow - Database Seed Script
 *
 * This script populates the database with comprehensive demo data.
 *
 * Demo Accounts:
 * - Students: juanperez@demo.com, mariagarcia@demo.com, etc. (10 total)
 * - Faculty: juanfaculty@demo.com, mariafaculty@demo.com, etc. (5 total)
 * - Admin: admin@demo.com
 * - All passwords: "password"
 *
 * Run with: npx prisma db seed
 * Reset database: npx prisma migrate reset
 */

import { PrismaClient, Role, EnrollmentStatus, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Helper function to generate photo URLs using UI Avatars
function generatePhotoUrl(name: string): string {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&size=200&background=3b82f6&color=fff`;
}

// Helper function to generate random date in range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Seeding database with comprehensive data...\n');

  // 1. Hash password for all demo accounts
  console.log('🔐 Hashing demo passwords...');
  const hashedPassword = await bcrypt.hash('password', 10);
  console.log('✓ Password hashed\n');

  // 2. Create students with Spanish names
  console.log('👥 Creating 10 students...');

  const studentData = [
    { name: 'Juan Pérez', email: 'juanperez@demo.com', major: 'Computer Science' },
    { name: 'María García', email: 'mariagarcia@demo.com', major: 'Information Systems' },
    { name: 'Carlos López', email: 'carloslopez@demo.com', major: 'Data Science' },
    { name: 'Ana Martínez', email: 'anamartinez@demo.com', major: 'Software Engineering' },
    { name: 'Luis Rodríguez', email: 'luisrodriguez@demo.com', major: 'Cybersecurity' },
    { name: 'Carmen Fernández', email: 'carmenfernandez@demo.com', major: 'Computer Science' },
    { name: 'Miguel Sánchez', email: 'miguelsanchez@demo.com', major: 'Information Technology' },
    { name: 'Laura González', email: 'lauragonzalez@demo.com', major: 'Data Science' },
    { name: 'David Ramírez', email: 'davidramirez@demo.com', major: 'Software Engineering' },
    { name: 'Isabel Torres', email: 'isabeltorres@demo.com', major: 'Artificial Intelligence' },
  ];

  const students: User[] = [];
  for (const data of studentData) {
    const student = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: Role.STUDENT,
        major: data.major,
        photoUrl: generatePhotoUrl(data.name),
      },
    });
    students.push(student);
    console.log(`  ✓ ${student.name} (${student.email})`);
  }
  console.log(`✓ Created ${students.length} students\n`);

  // 3. Create faculty members
  console.log('👨‍🏫 Creating 5 faculty members...');

  const facultyData = [
    { name: 'Juan Profesor', email: 'juanfaculty@demo.com', department: 'Computer Science' },
    { name: 'María Instructora', email: 'mariafaculty@demo.com', department: 'Data Science' },
    { name: 'Carlos Docente', email: 'carlosfaculty@demo.com', department: 'Software Engineering' },
    { name: 'Ana Profesora', email: 'anafaculty@demo.com', department: 'Artificial Intelligence' },
    { name: 'Luis Instructor', email: 'luisfaculty@demo.com', department: 'Mathematics' },
  ];

  const faculty: User[] = [];
  for (const data of facultyData) {
    const facultyMember = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: Role.INSTRUCTOR,
        department: data.department,
        photoUrl: generatePhotoUrl(data.name),
      },
    });
    faculty.push(facultyMember);
    console.log(`  ✓ ${facultyMember.name} (${facultyMember.email})`);
  }
  console.log(`✓ Created ${faculty.length} faculty members\n`);

  // 4. Create admin user
  console.log('🔑 Creating admin user...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'SpaceFlow Admin',
      password: hashedPassword,
      role: Role.ADMIN,
      department: 'Administration',
      photoUrl: generatePhotoUrl('SpaceFlow Admin'),
    },
  });
  console.log(`✓ ${admin.name} (${admin.email})\n`);

  // 5. Create 40 courses (20 programming + 20 AI)
  console.log('📚 Creating 40 courses...');

  await prisma.course.deleteMany({});

  const programmingCourses = [
    { title: 'JavaScript Fundamentals', description: 'Master JavaScript from basics to advanced concepts including ES6+ features, async programming, and modern patterns.', duration: 30, category: 'Programming' },
    { title: 'TypeScript Complete Guide', description: 'Learn TypeScript type system, interfaces, generics, and advanced types for building scalable applications.', duration: 25, category: 'Programming' },
    { title: 'Python Programming Mastery', description: 'Comprehensive Python course covering syntax, data structures, OOP, and practical applications.', duration: 35, category: 'Programming' },
    { title: 'Java Enterprise Development', description: 'Build enterprise applications with Java, Spring Boot, and modern Java features.', duration: 40, category: 'Programming' },
    { title: 'C# and .NET Core', description: 'Master C# programming and .NET Core framework for building cross-platform applications.', duration: 35, category: 'Programming' },
    { title: 'C++ Modern Programming', description: 'Learn modern C++ (C++17/20) with best practices, STL, and memory management.', duration: 40, category: 'Programming' },
    { title: 'Go Language Essentials', description: 'Build efficient concurrent applications with Go language and its powerful standard library.', duration: 28, category: 'Programming' },
    { title: 'Rust Systems Programming', description: 'Learn Rust for safe systems programming with ownership, borrowing, and zero-cost abstractions.', duration: 35, category: 'Programming' },
    { title: 'PHP Modern Development', description: 'Modern PHP development with Laravel, Symfony, and best practices.', duration: 30, category: 'Programming' },
    { title: 'Ruby on Rails Mastery', description: 'Build web applications quickly with Ruby on Rails framework and conventions.', duration: 32, category: 'Programming' },
    { title: 'React Complete Course', description: 'Master React with hooks, context, Redux, and modern patterns for building UIs.', duration: 30, category: 'Web Development' },
    { title: 'Angular Enterprise Apps', description: 'Build scalable enterprise applications with Angular, RxJS, and NgRx.', duration: 35, category: 'Web Development' },
    { title: 'Vue.js Frontend Development', description: 'Create reactive user interfaces with Vue.js, Vuex, and composition API.', duration: 28, category: 'Web Development' },
    { title: 'Node.js Backend Mastery', description: 'Build scalable backend services with Node.js, Express, and microservices architecture.', duration: 38, category: 'Backend' },
    { title: 'Django Web Framework', description: 'Develop robust web applications with Python Django framework and REST APIs.', duration: 35, category: 'Backend' },
    { title: 'Spring Boot Microservices', description: 'Create microservices architecture with Spring Boot, Spring Cloud, and Docker.', duration: 40, category: 'Backend' },
    { title: 'React Native Mobile Apps', description: 'Build cross-platform mobile applications with React Native and native APIs.', duration: 35, category: 'Mobile Development' },
    { title: 'Flutter Cross-Platform', description: 'Develop beautiful native apps for mobile, web, and desktop with Flutter and Dart.', duration: 38, category: 'Mobile Development' },
    { title: 'iOS Development with Swift', description: 'Create native iOS applications with Swift, SwiftUI, and iOS frameworks.', duration: 40, category: 'Mobile Development' },
    { title: 'Kotlin Android Development', description: 'Build modern Android apps with Kotlin, Jetpack Compose, and Android Studio.', duration: 38, category: 'Mobile Development' },
  ];

  const aiCourses = [
    { title: 'Machine Learning Fundamentals', description: 'Introduction to machine learning algorithms, supervised and unsupervised learning, and model evaluation.', duration: 40, category: 'Artificial Intelligence' },
    { title: 'Deep Learning with Neural Networks', description: 'Master neural networks, backpropagation, CNNs, RNNs, and deep learning architectures.', duration: 45, category: 'Artificial Intelligence' },
    { title: 'Natural Language Processing', description: 'Learn NLP techniques including tokenization, embeddings, transformers, and language models.', duration: 38, category: 'Artificial Intelligence' },
    { title: 'Computer Vision Mastery', description: 'Image processing, object detection, segmentation, and modern computer vision architectures.', duration: 40, category: 'Artificial Intelligence' },
    { title: 'Reinforcement Learning', description: 'Q-learning, policy gradients, actor-critic methods, and RL applications in games and robotics.', duration: 35, category: 'Artificial Intelligence' },
    { title: 'TensorFlow Complete Guide', description: 'Build and deploy ML models with TensorFlow, Keras API, and TensorFlow Extended.', duration: 35, category: 'AI Tools' },
    { title: 'PyTorch Deep Learning', description: 'Create neural networks with PyTorch, autograd, dynamic computation graphs, and deployment.', duration: 35, category: 'AI Tools' },
    { title: 'Keras for Deep Learning', description: 'Rapid prototyping of deep learning models with Keras high-level API.', duration: 25, category: 'AI Tools' },
    { title: 'Scikit-learn Machine Learning', description: 'Classical ML algorithms, preprocessing, model selection, and pipelines with scikit-learn.', duration: 30, category: 'AI Tools' },
    { title: 'Large Language Models (LLMs)', description: 'Understanding transformer architecture, GPT, BERT, and modern language models.', duration: 40, category: 'Advanced AI' },
    { title: 'Retrieval Augmented Generation', description: 'Build RAG systems combining LLMs with vector databases for enhanced AI applications.', duration: 30, category: 'Advanced AI' },
    { title: 'Fine-tuning AI Models', description: 'Techniques for fine-tuning pre-trained models, transfer learning, and domain adaptation.', duration: 32, category: 'Advanced AI' },
    { title: 'Prompt Engineering Mastery', description: 'Master prompt design, few-shot learning, chain-of-thought, and advanced prompting techniques.', duration: 20, category: 'Advanced AI' },
    { title: 'AI Ethics and Responsible AI', description: 'Understand bias, fairness, transparency, and ethical considerations in AI development.', duration: 18, category: 'AI Ethics' },
    { title: 'Generative AI Applications', description: 'Build applications with generative models including text, image, and code generation.', duration: 35, category: 'Advanced AI' },
    { title: 'AI for Business Applications', description: 'Practical AI applications in business: forecasting, recommendation systems, and automation.', duration: 28, category: 'Applied AI' },
    { title: 'Computer Vision with OpenCV', description: 'Image processing and computer vision using OpenCV library and practical applications.', duration: 30, category: 'AI Tools' },
    { title: 'Speech Recognition and Synthesis', description: 'Build speech-to-text and text-to-speech systems with modern deep learning approaches.', duration: 28, category: 'Artificial Intelligence' },
    { title: 'Time Series Forecasting with AI', description: 'Apply machine learning and deep learning to time series prediction and anomaly detection.', duration: 30, category: 'Applied AI' },
    { title: 'AutoML and Neural Architecture Search', description: 'Automated machine learning, hyperparameter tuning, and neural architecture search techniques.', duration: 25, category: 'Advanced AI' },
  ];

  const allCourses = [...programmingCourses, ...aiCourses];

  // Distribute courses among faculty and add instructorId
  const coursesWithInstructors = allCourses.map((course, i) => ({
    ...course,
    instructorId: faculty[i % faculty.length].id,
  }));

  const createdCourses = await prisma.course.createMany({ data: coursesWithInstructors });
  console.log(`✓ Created ${createdCourses.count} courses (20 programming + 20 AI)\n`);

  // 6. Create enrollments for students
  console.log('📝 Creating enrollments for students...');

  await prisma.enrollment.deleteMany({});
  await prisma.certificate.deleteMany({});

  const allCoursesData = await prisma.course.findMany();
  let totalEnrollments = 0;

  for (const student of students) {
    // Shuffle courses for variety
    const shuffledCourses = [...allCoursesData].sort(() => Math.random() - 0.5);

    // Each student gets 3-5 completed courses
    const numCompleted = 3 + Math.floor(Math.random() * 3); // 3-5
    const completedCourses = shuffledCourses.slice(0, numCompleted);

    // Each student gets 3-5 active courses
    const numActive = 3 + Math.floor(Math.random() * 3); // 3-5
    const activeCourses = shuffledCourses.slice(numCompleted, numCompleted + numActive);

    // Create completed enrollments
    for (const course of completedCourses) {
      const enrolledDate = randomDate(new Date(2024, 0, 1), new Date(2024, 6, 1));
      const completedDate = new Date(enrolledDate);
      completedDate.setDate(completedDate.getDate() + course.duration);

      await prisma.enrollment.create({
        data: {
          userId: student.id,
          courseId: course.id,
          status: EnrollmentStatus.COMPLETED,
          enrolledAt: enrolledDate,
          completedAt: completedDate,
        },
      });
      totalEnrollments++;
    }

    // Create active enrollments
    for (const course of activeCourses) {
      const enrolledDate = randomDate(new Date(2024, 8, 1), new Date());

      await prisma.enrollment.create({
        data: {
          userId: student.id,
          courseId: course.id,
          status: EnrollmentStatus.ACTIVE,
          enrolledAt: enrolledDate,
        },
      });
      totalEnrollments++;
    }
  }

  console.log(`✓ Created ${totalEnrollments} enrollments for ${students.length} students\n`);

  // 7. Create 4 floors in library
  console.log('🏢 Creating 4 library floors...');

  await prisma.floor.deleteMany({});

  const floors = [];
  for (let i = 1; i <= 4; i++) {
    const floor = await prisma.floor.create({
      data: {
        name: `Floor ${i}`,
        building: 'Main Library',
        svgPath: `/floors/floor${i}.svg`,
      },
    });
    floors.push(floor);
  }
  console.log(`✓ Created ${floors.length} floors\n`);

  // 8. Create 48 spaces (12 per floor: 6 tables of 8 + 6 tables of 4)
  console.log('🪑 Creating 48 spaces (12 per floor)...');

  await prisma.space.deleteMany({});

  const spaces = [];
  let spaceCounter = 1;

  for (let floorIndex = 0; floorIndex < floors.length; floorIndex++) {
    const floor = floors[floorIndex];
    const floorNum = floorIndex + 1;

    // Create 6 tables of 8 people (3 left vertical, 3 right vertical)
    // Left side - 3 tables
    for (let i = 0; i < 3; i++) {
      const spaceId = `space-table8-floor${floorNum}-left${i + 1}`;
      spaces.push({
        name: `Table ${spaceCounter}`,
        type: 'group-room',
        capacity: 8,
        minCapacity: 4,
        floorId: floor.id,
        equipment: JSON.stringify(['Whiteboard', 'Monitor', 'HDMI Cable']),
        coordinates: JSON.stringify({
          svgPathId: spaceId,
          boundingBox: {
            x: 50,
            y: 100 + (i * 200),
            width: 180,
            height: 150,
          },
          rotation: 0,
          config: {
            chairs: 8,
            chairsPosition: 'around',
            hasComputer: false,
          },
        }),
        photos: JSON.stringify(['/images/spaces/group-room-1.png']),
        description: `Group table for 4-8 people on Floor ${floorNum}. Equipped with whiteboard and monitor.`,
      });
      spaceCounter++;
    }

    // Right side - 3 tables
    for (let i = 0; i < 3; i++) {
      const spaceId = `space-table8-floor${floorNum}-right${i + 1}`;
      spaces.push({
        name: `Table ${spaceCounter}`,
        type: 'group-room',
        capacity: 8,
        minCapacity: 4,
        floorId: floor.id,
        equipment: JSON.stringify(['Whiteboard', 'TV', 'HDMI Cable']),
        coordinates: JSON.stringify({
          svgPathId: spaceId,
          boundingBox: {
            x: 650,
            y: 100 + (i * 200),
            width: 180,
            height: 150,
          },
          rotation: 0,
          config: {
            chairs: 8,
            chairsPosition: 'around',
            hasComputer: false,
          },
        }),
        photos: JSON.stringify(['/images/spaces/meeting-room-1.png']),
        description: `Group table for 4-8 people on Floor ${floorNum}. Equipped with whiteboard and TV.`,
      });
      spaceCounter++;
    }

    // Middle - 6 tables of 4 people (vertical arrangement)
    for (let i = 0; i < 6; i++) {
      const spaceId = `space-table4-floor${floorNum}-middle${i + 1}`;
      const deskImage = i % 2 === 0 ? '/images/spaces/study-desk-1.png' : '/images/spaces/study-desk-2.png';
      const hasComputer = i % 3 === 0;

      spaces.push({
        name: `Table ${spaceCounter}`,
        type: 'desk',
        capacity: 4,
        minCapacity: 2,
        floorId: floor.id,
        equipment: JSON.stringify(hasComputer ? ['Computer', 'Monitor', 'Desk Lamp'] : ['Desk Lamp']),
        coordinates: JSON.stringify({
          svgPathId: spaceId,
          boundingBox: {
            x: 350,
            y: 80 + (i * 100),
            width: 140,
            height: 90,
          },
          rotation: 0,
          config: {
            chairs: 4,
            chairsPosition: 'around',
            hasComputer,
          },
        }),
        photos: JSON.stringify([deskImage]),
        description: `Study table for 2-4 people on Floor ${floorNum}.${hasComputer ? ' Equipped with computer and monitor.' : ' Perfect for collaborative work.'}`,
      });
      spaceCounter++;
    }
  }

  const createdSpaces = await prisma.space.createMany({ data: spaces });
  console.log(`✓ Created ${createdSpaces.count} spaces across 4 floors\n`);

  // 9. Create reservations (15 per user for main users: 10 students + 2 faculty + 1 admin = 13 users)
  console.log('📅 Creating reservations...');

  await prisma.reservation.deleteMany({});

  const allSpacesData = await prisma.space.findMany();
  const now = new Date();

  // Main users for reservations: 10 students + 2 main faculty + admin
  const mainUsers = [...students, faculty[0], faculty[1], admin];

  const reservations = [];
  let reservationCount = 0;

  for (const user of mainUsers) {
    // Create 5 past reservations (between 30 days ago and 1 day ago)
    for (let i = 0; i < 5; i++) {
      const daysAgo = 30 - (i * 5); // Spread them out
      const space = allSpacesData[Math.floor(Math.random() * allSpacesData.length)];

      const startTime = new Date(now);
      startTime.setDate(startTime.getDate() - daysAgo);
      startTime.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0); // 9am-5pm

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 2); // 2 hour reservations

      const statuses = ['completed', 'completed', 'completed', 'cancelled'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      reservations.push({
        spaceId: space.id,
        userId: user.id,
        startTime,
        endTime,
        status,
        notes: status === 'cancelled' ? 'Cancelled due to schedule conflict' : `Past reservation`,
        cancelledBy: status === 'cancelled' ? (Math.random() > 0.5 ? 'user' : 'admin') : null,
      });
      reservationCount++;
    }

    // Create 10 upcoming reservations (next 10 days)
    for (let i = 0; i < 10; i++) {
      const daysAhead = i + 1;
      const space = allSpacesData[Math.floor(Math.random() * allSpacesData.length)];

      const startTime = new Date(now);
      startTime.setDate(startTime.getDate() + daysAhead);
      startTime.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 2);

      reservations.push({
        spaceId: space.id,
        userId: user.id,
        startTime,
        endTime,
        status: 'confirmed',
        notes: `Upcoming reservation for day ${daysAhead}`,
      });
      reservationCount++;
    }
  }

  const createdReservations = await prisma.reservation.createMany({ data: reservations });
  console.log(`✓ Created ${createdReservations.count} reservations\n`);

  // Summary
  console.log('✅ Seeding complete!\n');
  console.log('📊 Summary:');
  console.log(`  - Students: ${students.length}`);
  console.log(`  - Faculty: ${faculty.length}`);
  console.log(`  - Admins: 1`);
  console.log(`  - Total Users: ${students.length + faculty.length + 1}`);
  console.log(`  - Courses: ${createdCourses.count} (20 programming + 20 AI)`);
  console.log(`  - Enrollments: ${totalEnrollments}`);
  console.log(`  - Floors: ${floors.length}`);
  console.log(`  - Spaces: ${createdSpaces.count} (12 per floor)`);
  console.log(`  - Reservations: ${createdReservations.count}`);
  console.log('\n🔑 Sample Credentials (all use password: "password"):');
  console.log('  Students:');
  console.log('    - juanperez@demo.com');
  console.log('    - mariagarcia@demo.com');
  console.log('    - carloslopez@demo.com');
  console.log('  Faculty:');
  console.log('    - juanfaculty@demo.com');
  console.log('    - mariafaculty@demo.com');
  console.log('  Admin:');
  console.log('    - admin@demo.com');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
