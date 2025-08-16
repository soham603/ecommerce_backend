import express from "express";
import formidable from "express-formidable";
import { createCarousel, getAllCarousels } from "../controllers/CarouselController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create-carousel",requireSignIn, isAdmin, formidable(), createCarousel);

router.get("/get-carousels", getAllCarousels);

export default router;
