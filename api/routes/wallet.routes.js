import express from "express";
import { verifyUser } from "../utils/verifyUser.js";
import { getWallet, updateWalletBalance } from "../controllers/wallet.controller.js";

const router = express.Router();

router.get("/", verifyUser, getWallet);
router.post("/", verifyUser, updateWalletBalance);

export default router;
