import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
    },
    mobile: {
      type: String,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["student", "instructor"],
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "pending", "suspended", "rejected"],
      index: true,
    },
    joinDate: {
      type: Date,
    },
    wallet: {
      balance: {
        type: Number,
        default: 0,
      },
      history: [
        {
          type: Schema.Types.ObjectId,
          ref: "WalletTransaction",
        },
      ],
    },
    usedCoupons: [
      {
        code: String,
        usedCount: Number,
        usedAt: Date,
      },
    ],

    // Instructor-only fields
    bio: {
      type: String,
      trim: true,
    },
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    emailVerified: {
      type: Boolean,
      default: false,
    },
    mobileVerified: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for compound queries
UserSchema.index({
  email: 1,
  role: 1,
  status: 1,
  isDeleted: 1,
});


// Query middleware: exclude soft-deleted users
UserSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

// Soft delete method
UserSchema.methods.softDelete = function () {
  this.isDeleted = true;
  return this.save();
};

// Virtuals for easy access
UserSchema.virtual("isStudent").get(function () {
  return this.role === "student";
});

UserSchema.virtual("isInstructor").get(function () {
  return this.role === "instructor";
});

// Optional: Clean up unused fields based on role (on save)
UserSchema.pre("save", function (next) {
  if (this.role === "student") {
    this.joiningDate = Date.now();
    this.status = "active";
    this.bio = undefined;
    this.courses = undefined;
  } else if (this.role === "instructor") {
    this.status = "pending";
    this.enrolledCourses = undefined;
    this.wallet = undefined;
    this.usedCoupons = undefined;
  }
  next();
});

const User = model("User", UserSchema);
export default User;
