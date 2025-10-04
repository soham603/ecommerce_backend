// like.controller.js
import User from "../models/userModel.js";
import Product from "../models/ProductModel.js";

export const toggleLikeProduct = async (req, res) => {
  try {
    console.log('User:', req.user);

    const { productId } = req.body;
    console.log(`Product PAssed : ${productId}`);

    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const user = await User.findById(userId);

    const isLiked = user.likedProducts.includes(productId);

    if (isLiked) {
      user.likedProducts.pull(productId);
      await user.save();
      return res.json({ message: "Product unliked", liked: false });
    } else {
      user.likedProducts.push(productId);
      await user.save();
      return res.json({ message: "Product liked", liked: true });
    }
  } catch (err) {
    res.status(500).json({ message: "Error toggling like", error: err.message });
  }
};

export const getLikedProducts = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: "likedProducts",
      populate: { path: "category" }
    });

    const likedProducts = user.likedProducts.map(product => ({
      ...product.toObject(),
      isLiked: true
    }));

    res.json({ likedProducts });
  } catch (err) {
    res.status(500).json({ message: "Error fetching liked products", error: err.message });
  }
};
  