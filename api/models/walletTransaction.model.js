import { model, Schema } from "mongoose";

const walletTransactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true,
  },
  amount: { type: Number, required: true },
  description: { type: String }, // e.g., "Referral bonus", "Used in checkout"
  status: {
    type: String,
    enum: ["success", "pending", "failed"],
    default: "success",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const WalletTransactions = new model(
  "WalletTransactions",
  walletTransactionSchema
);

export default WalletTransactions;
