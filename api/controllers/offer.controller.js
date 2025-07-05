import mongoose from "mongoose";
import Offer from "../models/offer.model.js";
import { AppError } from "../utils/apperror.js";

// Get All Offers
export const getAllOffers = async (req, res, next) => {
  try {
    const { instructor } = req.query;

    let filter = {};

    if (instructor) {
      filter = {
        $or: [
          {
            // Instructor-specific offers
            applicableTo: {
              $elemMatch: {
                refModel: "Instructor",
                refId: new mongoose.Types.ObjectId(instructor),
              },
            },
          },
          {
            // Global offers: either no applicableTo or offer type is 'global'
            type: "global",
          },
        ],
      };
    }

    const offers = await Offer.find(filter).sort({ createdAt: -1 });

    if (!offers || offers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No offers found.",
      });
    }

    res.status(200).json({
      success: true,
      count: offers.length,
      offers,
    });
  } catch (err) {
    next(err);
  }
};

// Create Offer
export const createOffer = async (req, res, next) => {
  try {
    const {
      name,
      description,
      type,
      discountType = "percentage",
      discountValue,
      startDate,
      endDate,
      status = "upcoming",
      applicableTo,
    } = req.body;

    const offer = await Offer.create({
      name,
      description,
      type,
      discountType,
      discountValue,
      applicableTo,
      startDate,
      endDate,
      status,
    });

    res.status(201).json({ success: true, offer });
  } catch (err) {
    next(err);
  }
};

const offerFields = [
  "name",
  "description",
  "type",
  "discountType",
  "discountValue",
  "startDate",
  "endDate",
  "status",
];

// Update Offer
export const updateOffer = async (req, res, next) => {
  try {
    const { offerId } = req.params;

    const updateData = {};

    for (let key of offerFields) {
      if (req.body[key] != undefined) updateData[key] = req.body[key];
    }

    const updatedOffer = await Offer.findByIdAndUpdate(offerId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedOffer) {
      throw new AppError("Offer not found.", 404);
    }

    res.status(200).json({ success: true, offer: updatedOffer });
  } catch (err) {
    next(err);
  }
};

// Delete Offer
export const deleteOffer = async (req, res, next) => {
  try {
    const { offerId } = req.params;

    const deleted = await Offer.findByIdAndDelete(offerId);

    if (!deleted) {
      throw new AppError("Offer not found.", 404);
    }

    res
      .status(200)
      .json({ success: true, message: "Offer deleted successfully." });
  } catch (err) {
    next(err);
  }
};
