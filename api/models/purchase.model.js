import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        access: {
            type: String,
            enum: ["lifetime", "limited"],
            default: "lifetime",
        },
        expiresAt: {
            type: Date,
            required: function () {
                return this.access === "limited";
            },
        },
        refund: {
            isRefunded: {
                type: Boolean,
                default: false,
            },
            refundedAt: Date,
            reason: String,
        },
        purchasedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);
