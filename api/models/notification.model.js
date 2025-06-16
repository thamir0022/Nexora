import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  message: String,
  type: {
    type: String,
    enum: ['course', 'admin', 'instructor', 'announcement'],
    default: 'announcement'
  },
  isRead: { type: Boolean, default: false },
}, {
  timestamps: true
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;

