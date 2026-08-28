import { PrismaClient, UserRole, LocationType, TimeMode, IntentStatus, GroupStatus, GroupRole, MemberStatus, TripStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CampusLift database seeding...');

  // Clean existing data
  await prisma.rating.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.message.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.travelGroup.deleteMany();
  await prisma.travelIntent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.block.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();
  await prisma.college.deleteMany();

  // Create Colleges
  const college = await prisma.college.create({
    data: {
      name: 'Chitkara University Baddi',
      emailDomain: 'chitkarauniversity.edu.in',
      logo: 'https://media.licdn.com/dms/image/v2/C4D0BAQFhoSxToxhXuQ/company-logo_200_200/company-logo_200_200/0/1659503334979?e=2147483647&v=beta&t=OHNAnQTPBCB4kjh7u6xbNEtc3wUrGBQqFV3RrzTuTNo',
    },
  });

  const secondaryCollege = await prisma.college.create({
    data: {
      name: 'State University of Engineering',
      emailDomain: 'sue.edu',
      logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=300&q=80',
    },
  });

  console.log(`✅ Created colleges: ${college.name}, ${secondaryCollege.name}`);

  // Create Predefined Locations for Apex College
  const campusLoc = await prisma.location.create({
    data: {
      collegeId: college.id,
      name: 'Campus Main Gate',
      description: 'Main Security Gate & Auto Stand',
      type: LocationType.CAMPUS,
    },
  });

  const railwayLoc = await prisma.location.create({
    data: {
      collegeId: college.id,
      name: 'Central Railway Station',
      description: 'Platform 1 Main Exit Taxi Stand',
      type: LocationType.POPULAR,
    },
  });

  const busTerminalLoc = await prisma.location.create({
    data: {
      collegeId: college.id,
      name: 'City Bus Terminal',
      description: 'Interstate Bay 4',
      type: LocationType.POPULAR,
    },
  });

  const airportLoc = await prisma.location.create({
    data: {
      collegeId: college.id,
      name: 'International Airport T2',
      description: 'Arrivals Gate 3 Cab Pickup',
      type: LocationType.POPULAR,
    },
  });

  const techParkLoc = await prisma.location.create({
    data: {
      collegeId: college.id,
      name: 'Tech Park Plaza',
      description: 'Metro Station Entrance',
      type: LocationType.POPULAR,
    },
  });

  console.log('✅ Created predefined locations');

  // Password Hashes
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const studentPasswordHash = await bcrypt.hash('Student123!', 10);

  // Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'Campus Admin',
      email: 'admin@chitkarauniversity.edu.in',
      passwordHash: adminPasswordHash,
      collegeId: college.id,
      role: UserRole.ADMIN,
      isVerified: true,
      course: 'Administration',
      year: 'Staff',
    },
  });

  // Students
  const aman = await prisma.user.create({
    data: {
      name: 'Aman Sharma',
      email: 'aman@chitkarauniversity.edu.in',
      passwordHash: studentPasswordHash,
      phoneNumber: '+919876543210',
      collegeId: college.id,
      course: 'Computer Science',
      year: '3rd Year',
      isVerified: true,
    },
  });

  const rahul = await prisma.user.create({
    data: {
      name: 'Rahul Verma',
      email: 'rahul@chitkarauniversity.edu.in',
      passwordHash: studentPasswordHash,
      phoneNumber: '+919876543211',
      collegeId: college.id,
      course: 'Mechanical Engineering',
      year: '4th Year',
      isVerified: true,
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya@chitkarauniversity.edu.in',
      passwordHash: studentPasswordHash,
      phoneNumber: '+919876543212',
      collegeId: college.id,
      course: 'Electronics & Communication',
      year: '2nd Year',
      isVerified: true,
    },
  });

  const sneha = await prisma.user.create({
    data: {
      name: 'Sneha Roy',
      email: 'sneha@chitkarauniversity.edu.in',
      passwordHash: studentPasswordHash,
      phoneNumber: '+919876543213',
      collegeId: college.id,
      course: 'Data Science',
      year: '3rd Year',
      isVerified: true,
    },
  });

  const unverifiedStudent = await prisma.user.create({
    data: {
      name: 'Ananya Gupta',
      email: 'ananya@chitkarauniversity.edu.in',
      passwordHash: studentPasswordHash,
      phoneNumber: '+919876543214',
      collegeId: college.id,
      course: 'Civil Engineering',
      year: '1st Year',
      isVerified: false,
      verificationToken: 'demo-unverified-token-123',
    },
  });

  console.log('✅ Created admin and demo student users');

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  
  const effectiveStartAman = new Date(`${todayStr}T17:00:00.000Z`);
  const effectiveEndAman = new Date(`${todayStr}T17:40:00.000Z`);

  // Intent 1: Aman Campus -> Railway Station (Range)
  const intentAman = await prisma.travelIntent.create({
    data: {
      creatorId: aman.id,
      fromLocationId: campusLoc.id,
      toLocationId: railwayLoc.id,
      date: todayStr,
      timeMode: TimeMode.RANGE,
      startTime: '17:00',
      endTime: '17:40',
      effectiveStart: effectiveStartAman,
      effectiveEnd: effectiveEndAman,
      note: 'Catching 6:15 PM Express Train. Looking to split an auto.',
      status: IntentStatus.MATCHED,
    },
  });

  const effectiveStartRahul = new Date(`${todayStr}T17:15:00.000Z`);
  const effectiveEndRahul = new Date(`${todayStr}T17:45:00.000Z`);

  // Intent 2: Rahul Campus -> Railway Station (Flexible)
  const intentRahul = await prisma.travelIntent.create({
    data: {
      creatorId: rahul.id,
      fromLocationId: campusLoc.id,
      toLocationId: railwayLoc.id,
      date: todayStr,
      timeMode: TimeMode.FLEXIBLE,
      preferredTime: '17:30',
      flexibilityMinutes: 15,
      effectiveStart: effectiveStartRahul,
      effectiveEnd: effectiveEndRahul,
      note: 'Heading to station. Flexible by 15 mins.',
      status: IntentStatus.MATCHED,
    },
  });

  // Intent 3: Priya Railway Station -> Campus (Flexible)
  const effectiveStartPriya = new Date(`${todayStr}T18:00:00.000Z`);
  const effectiveEndPriya = new Date(`${todayStr}T18:30:00.000Z`);

  await prisma.travelIntent.create({
    data: {
      creatorId: priya.id,
      fromLocationId: railwayLoc.id,
      toLocationId: campusLoc.id,
      date: todayStr,
      timeMode: TimeMode.FLEXIBLE,
      preferredTime: '18:15',
      flexibilityMinutes: 15,
      effectiveStart: effectiveStartPriya,
      effectiveEnd: effectiveEndPriya,
      note: 'Arriving at station platform 2. Returning to hostel.',
      status: IntentStatus.ACTIVE,
    },
  });

  // Intent 4: Sneha Campus -> Tech Park (Range)
  const effectiveStartSneha = new Date(`${todayStr}T19:00:00.000Z`);
  const effectiveEndSneha = new Date(`${todayStr}T19:30:00.000Z`);

  await prisma.travelIntent.create({
    data: {
      creatorId: sneha.id,
      fromLocationId: campusLoc.id,
      toLocationId: techParkLoc.id,
      date: todayStr,
      timeMode: TimeMode.RANGE,
      startTime: '19:00',
      endTime: '19:30',
      effectiveStart: effectiveStartSneha,
      effectiveEnd: effectiveEndSneha,
      note: 'Heading to hackathon meetup.',
      status: IntentStatus.ACTIVE,
    },
  });

  console.log('✅ Created sample travel intents');

  // Sample Travel Group
  const group = await prisma.travelGroup.create({
    data: {
      collegeId: college.id,
      fromLocationId: campusLoc.id,
      toLocationId: railwayLoc.id,
      date: todayStr,
      commonTime: '5:30 PM',
      meetingPointId: campusLoc.id,
      status: GroupStatus.PLANNING,
    },
  });

  // Members
  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: aman.id,
      intentId: intentAman.id,
      role: GroupRole.LEADER,
      status: MemberStatus.ACTIVE,
    },
  });

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: rahul.id,
      intentId: intentRahul.id,
      role: GroupRole.MEMBER,
      status: MemberStatus.ACTIVE,
    },
  });

  // System & Chat Messages
  await prisma.message.create({
    data: {
      groupId: group.id,
      senderId: null,
      content: 'Aman Sharma created the travel group.',
      isSystemMessage: true,
    },
  });

  await prisma.message.create({
    data: {
      groupId: group.id,
      senderId: null,
      content: 'Rahul Verma joined the travel group.',
      isSystemMessage: true,
    },
  });

  await prisma.message.create({
    data: {
      groupId: group.id,
      senderId: aman.id,
      content: 'Hey Rahul! Should we take an auto right outside Campus Gate at 5:30 PM?',
      isSystemMessage: false,
    },
  });

  await prisma.message.create({
    data: {
      groupId: group.id,
      senderId: rahul.id,
      content: 'Perfect! 5:30 PM at Campus Gate works great for me.',
      isSystemMessage: false,
    },
  });

  // Notifications
  await prisma.notification.create({
    data: {
      userId: aman.id,
      type: 'GROUP_JOIN',
      title: 'New Member Joined',
      body: 'Rahul Verma joined your Campus → Central Railway Station group!',
      metadata: { groupId: group.id },
    },
  });

  await prisma.notification.create({
    data: {
      userId: rahul.id,
      type: 'MATCH_FOUND',
      title: 'Compatible Match Found',
      body: 'You matched with Aman Sharma for Central Railway Station at 5:30 PM.',
      metadata: { groupId: group.id },
    },
  });

  console.log('✅ Created demo group, members, chat messages, and notifications');

  console.log('\n🎉 CampusLift seeding complete!');
  console.log('----------------------------------------------------');
  console.log('Demo Accounts:');
  console.log('Admin:       admin@chitkarauniversity.edu.in   / Admin123!');
  console.log('Student 1:   aman@chitkarauniversity.edu.in    / Student123! (Verified)');
  console.log('Student 2:   rahul@chitkarauniversity.edu.in   / Student123! (Verified)');
  console.log('Student 3:   priya@chitkarauniversity.edu.in   / Student123!(Verified)');
  console.log('Unverified:  ananya@chitkarauniversity.edu.in  / Student123!');
  console.log('----------------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
