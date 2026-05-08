/**
 * SmartAttend Seed Script
 * Run: npx ts-node --project tsconfig.json scripts/seed.ts
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-system';

// ── Inline schemas (no module resolution issues) ──────────────
const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true, lowercase: true },
  password: String, role: String, isActive: { type: Boolean, default: true },
}, { timestamps: true });

const ClassSchema = new mongoose.Schema({
  name: String, department: String, semester: Number,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
  totalStudents: { type: Number, default: 0 },
}, { timestamps: true });

const TeacherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employeeId: String, department: String,
  subjects: [String], classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
}, { timestamps: true });

const StudentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rollNo: { type: String, unique: true }, classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  department: String, semester: Number,
  deviceId: String, browserFingerprint: String,
  trustScore: { type: Number, default: 100 }, flaggedCount: { type: Number, default: 0 },
}, { timestamps: true });

const TimetableSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  subject: String, teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  dayOfWeek: Number, startTime: String, endTime: String, room: String,
  isActive: { type: Boolean, default: true },
  currentQRToken: String, qrExpiresAt: Date,
  attendanceWindowOpen: { type: Boolean, default: false },
  attendanceWindowOpenAt: Date, attendanceWindowCloseAt: Date,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Class = mongoose.models.Class || mongoose.model('Class', ClassSchema);
const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);
const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', TimetableSchema);

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  // Clean slate
  await Promise.all([
    User.deleteMany({}), Class.deleteMany({}),
    Teacher.deleteMany({}), Student.deleteMany({}), Timetable.deleteMany({}),
  ]);
  console.log('🧹 Cleared existing data');

  const hash = (p: string) => bcrypt.hash(p, 10);

  // ── Admin ──────────────────────────────────────────────────
  await User.create({
    name: 'Admin User', email: 'admin@demo.edu',
    password: await hash('demo123'), role: 'admin',
  });

  // ── Teachers ───────────────────────────────────────────────
  const [tUser1, tUser2] = await User.insertMany([
    { name: 'Dr. Sharma', email: 'teacher@demo.edu', password: await hash('demo123'), role: 'teacher' },
    { name: 'Prof. Verma', email: 'teacher2@demo.edu', password: await hash('demo123'), role: 'teacher' },
  ]);

  // ── Classes ────────────────────────────────────────────────
  const [csea, cseb] = await Class.insertMany([
    { name: 'CSE-A', department: 'Computer Science', semester: 5, totalStudents: 0 },
    { name: 'CSE-B', department: 'Computer Science', semester: 5, totalStudents: 0 },
  ]);

  // ── Teacher records ────────────────────────────────────────
  const [teacher1, teacher2] = await Teacher.insertMany([
    { userId: tUser1._id, employeeId: 'EMP001', department: 'Computer Science', subjects: ['DBMS', 'DBMS Lab'], classIds: [csea._id, cseb._id] },
    { userId: tUser2._id, employeeId: 'EMP002', department: 'Computer Science', subjects: ['Operating Systems', 'Networks'], classIds: [csea._id] },
  ]);

  // Update classes with teacher refs
  await Class.findByIdAndUpdate(csea._id, { $push: { teachers: [teacher1._id, teacher2._id] } });
  await Class.findByIdAndUpdate(cseb._id, { $push: { teachers: [teacher1._id] } });

  // ── Students ───────────────────────────────────────────────
  const studentUsers = await User.insertMany([
    { name: 'Aarav Sharma', email: 'student@demo.edu', password: await hash('demo123'), role: 'student' },
    { name: 'Priya Patel', email: 'priya@demo.edu', password: await hash('demo123'), role: 'student' },
    { name: 'Rohan Gupta', email: 'rohan@demo.edu', password: await hash('demo123'), role: 'student' },
    { name: 'Sneha Rao', email: 'sneha@demo.edu', password: await hash('demo123'), role: 'student' },
    { name: 'Karan Singh', email: 'karan@demo.edu', password: await hash('demo123'), role: 'student' },
  ]);

  const studentDocs = await Student.insertMany(
    studentUsers.map((u, i) => ({
      userId: u._id,
      rollNo: `CSE2301${i + 1}`,
      classId: csea._id,
      department: 'Computer Science',
      semester: 5,
      trustScore: 100 - i * 5,
    }))
  );

  // Update class with student refs
  await Class.findByIdAndUpdate(csea._id, {
    students: studentDocs.map(s => s._id),
    totalStudents: studentDocs.length,
  });

  // ── Timetable ──────────────────────────────────────────────
  const today = new Date().getDay(); // 0=Sun ... 6=Sat
  const now = new Date();
  const windowOpen = new Date(now.getTime() - 5 * 60 * 1000);   // opened 5min ago
  const windowClose = new Date(now.getTime() + 55 * 60 * 1000); // closes in 55min

  await Timetable.insertMany([
    // Active class NOW (CSE-A DBMS)
    {
      classId: csea._id, subject: 'Database Management Systems',
      teacherId: teacher1._id, dayOfWeek: today,
      startTime: `${String(now.getHours()).padStart(2,'0')}:00`,
      endTime: `${String(now.getHours() + 1).padStart(2,'0')}:00`,
      room: 'Lab-3', isActive: true,
      attendanceWindowOpen: true,
      attendanceWindowOpenAt: windowOpen,
      attendanceWindowCloseAt: windowClose,
    },
    // Upcoming (OS)
    {
      classId: csea._id, subject: 'Operating Systems',
      teacherId: teacher2._id, dayOfWeek: today,
      startTime: `${String(now.getHours() + 1).padStart(2,'0')}:00`,
      endTime: `${String(now.getHours() + 2).padStart(2,'0')}:00`,
      room: 'A-201', isActive: true,
      attendanceWindowOpen: false,
    },
    // Another class (different day — not today)
    {
      classId: csea._id, subject: 'Computer Networks',
      teacherId: teacher2._id, dayOfWeek: (today + 1) % 7,
      startTime: '11:00', endTime: '12:00', room: 'B-102', isActive: true,
      attendanceWindowOpen: false,
    },
    // CSE-B DBMS
    {
      classId: cseb._id, subject: 'DBMS Lab',
      teacherId: teacher1._id, dayOfWeek: today,
      startTime: `${String(now.getHours()).padStart(2,'0')}:30`,
      endTime: `${String(now.getHours() + 2).padStart(2,'0')}:30`,
      room: 'Lab-1', isActive: true,
      attendanceWindowOpen: false,
    },
  ]);

  console.log('\n✅ Seed complete!');
  console.log('─────────────────────────────────────────');
  console.log('🔑 Login credentials:');
  console.log('  Admin:   admin@demo.edu   / demo123');
  console.log('  Teacher: teacher@demo.edu / demo123');
  console.log('  Student: student@demo.edu / demo123');
  console.log('─────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
