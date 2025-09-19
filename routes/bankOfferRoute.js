import express from 'express';
import { fetchAllBankOffers } from '../controllers/bankOffersController.js';

const router = express.Router();

router.get("/get-AllBankOffers", fetchAllBankOffers);

export default router;