import express from "express";
import { createCategoryController, deleteCategoryController, getallCategoriesController, getsingleCategoriesController, updateCategoryController } from "../controllers/CategoryController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create New Category 
router.post('/create-category', requireSignIn, isAdmin, createCategoryController);

// Update Category
router.put('/update-category/:id', requireSignIn, isAdmin, updateCategoryController);

//Get All Category
router.get('/get-allcategories', getallCategoriesController);

// Get Single Category
router.get('/get-single-categories/:slug', getsingleCategoriesController);

// Delete Category
router.delete('/delete-categories/:id', requireSignIn ,isAdmin, deleteCategoryController);


export default router;