import { model, Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: [{
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    }],
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    refund: {
      isRefunded: {
        type: Boolean,
        default: false,
      },
      refundedAt: Date,
      reason: String,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = model('Payment', paymentSchema);
export default Payment;