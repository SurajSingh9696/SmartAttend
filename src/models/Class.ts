import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
  name: string;
  department: string;
  semester: number;
  students: mongoose.Types.ObjectId[];
  teachers: mongoose.Types.ObjectId[];
  totalStudents: number;
}

const ClassSchema = new Schema<IClass>({
  name: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  students: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  teachers: [{ type: Schema.Types.ObjectId, ref: 'Teacher' }],
  totalStudents: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);
