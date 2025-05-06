import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const certificateSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    completionDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Certificate = model('Certificate', certificateSchema);
export default Certificate;
