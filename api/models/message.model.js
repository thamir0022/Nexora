import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, 
    },
    content: String,
  },
  { timestamps: true }
);
const Message = mongoose.model("Message", messageSchema);

export default Message;
