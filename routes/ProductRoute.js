import express from "express";
import { isAdmin, requireSignIn, optionalAuth } from "../middlewares/authMiddleware.js";
import formidable from "express-formidable";
import {
  createProductController,
  deleteProductController,
  getProductsController,
  getSingleProductsController,
  updateProductController,
  productFiltersController,
  productCountController,
  searchProductController,
  similarProductsController,
  productPerCategoryController,
  braintreeTokenController,
  braintreePaymentController,
} from "../controllers/ProductController.js";

const router = express.Router();

// ------------------------- PRODUCT ROUTES -------------------------

// Create Product (Admin only)
router.post(
  "/create-product",
  requireSignIn,
  isAdmin,
  formidable(),
  createProductController
);

// Get All Products (Optional auth - shows likes for logged in users)
router.get("/get-allproducts", optionalAuth, getProductsController);

// Get Single Product (Optional auth)
router.get("/get-singleproduct/:slug", optionalAuth, getSingleProductsController);

// Delete Product (Admin only)
router.delete("/delete-product/:pid", requireSignIn, isAdmin, deleteProductController);

// Update Product (Admin only)
router.put(
  "/update-product/:pid",
  requireSignIn,
  isAdmin,
  formidable(),
  updateProductController
);

// Filter Products (Optional auth - shows likes for logged in users)
router.get("/product-filters", optionalAuth, productFiltersController);

// Product Count (No auth needed)
router.get("/product-count", productCountController);

// Search Products (Optional auth - shows likes for logged in users)
router.get("/search-product/:keyword", optionalAuth, searchProductController);

// Similar/Related Products (Optional auth - shows likes for logged in users)
router.get("/related-products/:pid/:cid", optionalAuth, similarProductsController);

// Products per Category (Optional auth - shows likes for logged in users)
router.get("/product-category/:slug", optionalAuth, productPerCategoryController);

// ------------------------- PAYMENT ROUTES -------------------------

// Get Braintree Token (No auth needed)
router.get("/brtr/token", braintreeTokenController);

// Braintree Payment (Login required)
router.post("/brtr/payment", requireSignIn, braintreePaymentController);

export default router;