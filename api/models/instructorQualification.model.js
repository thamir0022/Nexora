import { Schema, model } from 'mongoose';

const instructorQualificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    qualifications: [
      {
        degree: {
          type: String,
          trim: true,
          required: true,
        },
        certificateURL: {
          type: String,
          trim: true,
          required: true,
        },
      },
    ],
    experienceSummary: {
      type: String,
      trim: true,
      required: true,
    },
    portfolioLink: {
      type: String,
      trim: true,
    },
    socialLinks: [
      {
        platform: {
          type: String,
          trim: true,
          required: true,
        },
        url: {
          type: String,
          trim: true,
          required: true,
        },
      },
    ],
    status: {
      type: Boolean,
      default: false,
    },
    feedback: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // includes createdAt and updatedAt
  }
);

const InstructorQualification = model(
  'InstructorQualification',
  instructorQualificationSchema
);

export default InstructorQualification;
