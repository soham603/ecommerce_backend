import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Products",
          required: true,
        },
        name: { type: String, required: true },   
        price: { type: Number, required: true }, 
        quantity: { type: Number, required: true }
      },
    ],
    totalAmount: { type: Number, required: true },
    payment: {
      id: { type: String },
      status: { type: String },
      mode: { type: String },
    },
    status: {
      type: String,
      enum: ["Not Process", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Not Process",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
