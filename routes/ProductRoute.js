import express  from "express";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import formidable from 'express-formidable';
import { createProductController, deleteProductController, getProductsController, getSingleProductsController, updateProductController, productFiltersController, productCountController, productListPageController, searchProductController, similarProductsController, productpercategoryController, braintreeTokenController, braintreePaymentController } from "../controllers/ProductController.js";

const router = express.Router();

// routes
router.post('/create-product', requireSignIn, isAdmin, formidable(), createProductController);

// Get Products
router.get('/get-allproducts', getProductsController);

// Get Single Product
router.get('/get-singleproduct/:slug', getSingleProductsController);

// // Get Photos
// router.get('/get-product-photo/:pid', productPhotoController);

// Get Single Product
router.delete('/delete-product/:pid', deleteProductController);

// Update Product
router.put('/update-product/:pid', requireSignIn, isAdmin,formidable(), updateProductController);

// filter product
router.get('/product-filters', productFiltersController);

// product count
router.get('/product-count', productCountController);

// product per page
router.get("/product-list/:page", productListPageController);

// Search product
router.get('/search-product/:keyword', searchProductController);

// similar product
router.get('/related-products/:pid/:cid', similarProductsController);

// category wise
router.get('/product-category/:slug', productpercategoryController);

// payments routes
router.get('/brtr/token', braintreeTokenController);

// payments
router.post('/brtr/payment', requireSignIn, braintreePaymentController);

export default router;