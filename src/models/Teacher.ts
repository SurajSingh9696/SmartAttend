import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacher extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  department: string;
  assignedClasses: mongoose.Types.ObjectId[];
  classIds: mongoose.Types.ObjectId[];
  subjects: string[];
}

const TeacherSchema = new Schema<ITeacher>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: String, unique: true, sparse: true },
  department: { type: String, required: true },
  assignedClasses: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
  classIds: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
  subjects: [{ type: String }],
}, { timestamps: true });

export default mongoose.models.Teacher || mongoose.model<ITeacher>('Teacher', TeacherSchema);

