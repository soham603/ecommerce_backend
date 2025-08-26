import mongoose from "mongoose";
import Counter from "./CounterModel.js";

const ProductSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: mongoose.ObjectId, ref: 'Category', required: true },
    quantity: { type: Number, required: true },
    images: { type: [String], required: true },
    shipping: { type: Boolean },
    categoryName: { type: String },
    ratings: {
        type: Number,
        required: true,
      },      
}, { timestamps: true });

ProductSchema.pre("save", async function (next) {
    if (this.isNew) {
        const counter = await Counter.findByIdAndUpdate(
            { _id: "productid" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.id = counter.seq;
    }
    next();
});

export default mongoose.model("Products", ProductSchema);
