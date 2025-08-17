import express from "express";
import { optionalAuth, requireSignIn } from "../middlewares/authMiddleware.js";
import {
  toggleLikeProduct,
  getLikedProducts,
} from "../controllers/likeController.js";

const router = express.Router();

// Toggle Like/Unlike Product (Login required)
router.post("/toggle-like", optionalAuth, toggleLikeProduct);

// Get All Liked Products by User (Login required)
router.get("/liked-products", requireSignIn, getLikedProducts);

export default router;