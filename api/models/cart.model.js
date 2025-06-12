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
        ref: 'Course',
        required: true,
      }
    ],
  },
  {
    timestamps: true,
  }
);

const Cart = model('Cart', cartSchema);
export default Cart;
