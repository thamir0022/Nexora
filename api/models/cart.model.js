import {Schema, model} from 'mongoose';


const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course', // adjust the ref name based on your actual product model
        required: true,
      }
    ],
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Cart = model('Cart', cartSchema);
export default Cart;
