import { model, Schema } from "mongoose";

const wishlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
      }
    ],
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields
  }
);

const Wishlist = model('Wishlist', wishlistSchema);
export default Wishlist;