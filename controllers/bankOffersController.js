import BankOfferModel from "../models/bankOfferModel.js";

// GET all bank offers
export const fetchAllBankOffers = async (req, res) => {
  try {
    const bankOffers = await BankOfferModel.find();
    res.status(200).send({
      success: true,
      message: "Bank Offers fetched successfully",
      data: bankOffers,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Fetching Bank Offers",
      error,
    });
  }
};
