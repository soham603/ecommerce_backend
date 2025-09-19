import mongoose from "mongoose";

const bankOfferSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    offerImage: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    tncHtml: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // adds createdAt & updatedAt
);

const BankOffer = mongoose.model("BankOffer", bankOfferSchema, "bankOffers");
export default BankOffer;
