import { model, Schema } from "mongoose";

const orderSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'upi', 'net_banking', 'cash'], // add/remove as needed
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

const Order = model('Order', orderSchema);
export default Order;