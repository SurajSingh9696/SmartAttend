import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  rollNo: string;
  classId: mongoose.Types.ObjectId;
  department: string;
  semester: number;
  deviceId?: string;
  browserFingerprint?: string;
  faceEmbedding?: number[];
  trustScore: number;
  flaggedCount: number;
}

const StudentSchema = new Schema<IStudent>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rollNo: { type: String, required: true, unique: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  deviceId: { type: String },
  browserFingerprint: { type: String },
  faceEmbedding: [{ type: Number }],
  trustScore: { type: Number, default: 100, min: 0, max: 100 },
  flaggedCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
