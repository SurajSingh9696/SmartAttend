import mongoose, { Schema, Document } from 'mongoose';

export interface ITimetable extends Document {
  classId: mongoose.Types.ObjectId;
  subject: string;
  teacherId: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0=Sun, 1=Mon ... 6=Sat
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  room: string;
  isActive: boolean;
  currentQRToken?: string;
  qrExpiresAt?: Date;
  attendanceWindowOpen: boolean;
  attendanceWindowOpenAt?: Date;
  attendanceWindowCloseAt?: Date;
}

const TimetableSchema = new Schema<ITimetable>({
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  subject: { type: String, required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String, default: 'TBD' },
  isActive: { type: Boolean, default: true },
  currentQRToken: { type: String },
  qrExpiresAt: { type: Date },
  attendanceWindowOpen: { type: Boolean, default: false },
  attendanceWindowOpenAt: { type: Date },
  attendanceWindowCloseAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.Timetable || mongoose.model<ITimetable>('Timetable', TimetableSchema);
