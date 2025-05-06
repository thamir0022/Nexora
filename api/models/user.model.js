import { Schema, model } from 'mongoose';

// Base User Schema
const options = { discriminatorKey: 'role', timestamps: true };

const UserSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'instructor'],
      required: true,
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: function () {
        return this.role === 'instructor' ? 'pending' : 'active';
      },
    },
  },
  options
);

const User = model('User', UserSchema);

// Instructor-specific schema
const InstructorSchema = new Schema({
  bio: {
    type: String,
    trim: true,
  },
  courses: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
  ],
  rating: {
    totalReviews: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
});

const Instructor = User.discriminator('instructor', InstructorSchema);

export { User, Instructor };
