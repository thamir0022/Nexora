import { model, Schema } from "mongoose";

const wishlistSchema = new Schema(
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

const Wishlist = model('Wishlist', wishlistSchema);
export default Wishlist;