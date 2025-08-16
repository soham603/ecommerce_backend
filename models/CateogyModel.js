import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    slug:{
        type: String,
        lowercase: true
    },
    image: {
        type: String,
        required: true,
    },
});

export default mongoose.model("Category", CategorySchema);