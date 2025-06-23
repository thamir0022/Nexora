import { model, Schema } from "mongoose";

const walletTransactionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  wallet: {
    type: Schema.Types.ObjectId,
    ref: "Wallet",
  },
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true,
  },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["success", "pending", "failed"],
    default: "success",
  },
  meta: {
    type: Object,
    default: {},
  }
}, { timestamps: true });


const WalletTransactions = model(
  "WalletTransactions",
  walletTransactionSchema
);

export default WalletTransactions;
