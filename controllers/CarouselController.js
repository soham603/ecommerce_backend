import Carousel from "../models/CarouselModel.js";
import cloudinary from "cloudinary";

export const createCarousel = async (req, res) => {
  try {
    const { title, description } = req.fields;
    const { image } = req.files || {};

    if (!title) return res.status(400).send({ message: "Title is required" });
    if (!description) return res.status(400).send({ message: "Description is required" });
    if (!image) return res.status(400).send({ message: "Image is required" });

    const uploadResult = await cloudinary.v2.uploader.upload(image.path, {
      folder: "ecommerce_carousel",
    });

    const carousel = new Carousel({
      image: uploadResult.secure_url,
      title,
      description,
    });

    await carousel.save();

    res.status(201).send({
      success: true,
      message: "Carousel item created successfully",
      carousel,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error creating carousel item",
      error,
    });
  }
};


export const getAllCarousels = async (req, res) => {
  try {
    const carousels = await Carousel.find().sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      count: carousels.length,
      carousels,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error fetching carousel items",
      error,
    });
  }
};
