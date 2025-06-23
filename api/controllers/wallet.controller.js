import Wallet from "../models/wallet.model.js";
import WalletTransactions from "../models/walletTransaction.model.js";
import { AppError } from "../utils/apperror.js";

export const getWallet = async (req, res, next) => {
  try {
    const { user: queryUserId } = req.query;
    const { _id: requesterId, role } = req.user;

    const targetUserId = role === "admin" ? (queryUserId || requesterId) : requesterId;

    const wallet = await Wallet.findOne({ user: targetUserId }).select("-status");
    if (!wallet) {
      throw new AppError(`Wallet not found for user`, 404);
    }

    return res.status(200).json({
      success: true,
      message: "Wallet retrieved successfully.",
      wallet,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWalletBalance = async (req, res, next) => {
  try {
    const { type, amount, meta } = req.body;
    const { _id: userId, role } = req.user;

    if (!["credit", "debit"].includes(type)) {
      throw new AppError("Invalid transaction type. Must be 'credit' or 'debit'.", 400);
    }

    if (!amount || amount <= 0) {
      throw new AppError("Amount must be greater than 0.", 400);
    }

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) throw new AppError("Wallet not found for the user.", 404);

    if (type === "credit" && role !== "admin") {
      throw new AppError("Only admin can credit user wallets.", 403);
    }

    if (type === "debit" && wallet.balance < amount) {
      throw new AppError("Insufficient wallet balance.", 400);
    }

    wallet.balance += type === "credit" ? amount : -amount;
    await wallet.save();

    await WalletTransactions.create({
      userId,
      type,
      amount,
      meta,
      status: "success",
    });

    return res.status(200).json({
      message: `Wallet ${type}ed successfully.`,
      balance: wallet.balance,
    });

  } catch (err) {
    next(err);
  }
};

