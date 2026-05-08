import mongoose, { Schema, Document } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'flagged' | 'rejected' | 'pending';

export interface IVerificationStep {
  step: string;
  status: 'pass' | 'fail' | 'skip';
  detail?: string;
}

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  timetableId: mongoose.Types.ObjectId;
  date: Date;
  timestamp: Date;
  status: AttendanceStatus;
  riskScore: number; // 0-100, higher = more risky
  trustScoreAtTime: number;
  verificationSteps: IVerificationStep[];
  deviceId?: string;
  browserFingerprint?: string;
  ipAddress?: string;
  gpsLat?: number;
  gpsLng?: number;
  flagReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  timetableId: { type: Schema.Types.ObjectId, ref: 'Timetable', required: true },
  date: { type: Date, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  status: { type: String, enum: ['present', 'absent', 'flagged', 'rejected', 'pending'], default: 'pending' },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  trustScoreAtTime: { type: Number },
  verificationSteps: [{
    step: String,
    status: { type: String, enum: ['pass', 'fail', 'skip'] },
    detail: String,
  }],
  deviceId: String,
  browserFingerprint: String,
  ipAddress: String,
  gpsLat: Number,
  gpsLng: Number,
  flagReason: String,
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true });

AttendanceSchema.index({ studentId: 1, date: 1 });
AttendanceSchema.index({ classId: 1, date: 1 });
AttendanceSchema.index({ status: 1 });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
