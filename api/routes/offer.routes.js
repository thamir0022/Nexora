import express from "express";
import { createOffer, deleteOffer, getAllOffers, updateOffer } from "../controllers/offer.controller.js";

const router = express.Router();

router.get("/", getAllOffers);
router.post("/", createOffer);
router.patch("/:offerId", updateOffer);
router.delete("/:offerId", deleteOffer);

export default router;