import ProductModel from "../models/ProductModel.js";
import Categorymodel from "../models/CateogyModel.js";
import OrderModel from "../models/OrderModel.js";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";
import cloudinary from "../config/cloudinary.js";
import userModel from "../models/userModel.js";
import { paginate } from "../middlewares/pagination.js";
import CounterModel from "../models/CounterModel.js";

dotenv.config();

// Payment Gateway
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});


// ------------------------- CREATE PRODUCT -------------------------
export const createProductController = async (req, res) => {
  try {
    const { name, description, price, quantity, category, shipping, categoryName, ratings } = req.fields;

    // ---------------------- Validation ----------------------
    switch (true) {
      case !name: return res.status(400).send({ error: "Name is Required" });
      case !description: return res.status(400).send({ error: "Description is Required" });
      case !price: return res.status(400).send({ error: "Price is Required" });
      case !quantity: return res.status(400).send({ error: "Quantity is Required" });
      case !category: return res.status(400).send({ error: "Category ID is Required" });
      case !ratings: return res.status(400).send({ error: "Ratings is Required" });
    }

    // ---------------------- Handle Images ----------------------
    const uploadedFiles = req.files?.image;
    const filesArray = uploadedFiles
      ? Array.isArray(uploadedFiles)
        ? uploadedFiles
        : [uploadedFiles]
      : [];

    let imageUrls = [];
    for (let file of filesArray) {
      const result = await cloudinary.v2.uploader.upload(file.path, { folder: "ecommerce_products" });
      imageUrls.push(result.secure_url);
    }

    const counter = await CounterModel.findOneAndUpdate(
      { _id: "productId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const product = new ProductModel({
      id: counter.seq,
      name,
      slug: slugify(name),
      description,
      price,
      quantity,
      shipping: shipping || false,
      ratings,
      category,
      categoryName: categoryName || (await Categorymodel.findById(category)).name,
      images: imageUrls,
    });

    await product.save();

    res.status(201).send({
      success: true,
      message: "Product Added Successfully",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error in creating product", error });
  }
};

// ------------------------- GET ALL PRODUCTS -------------------------
export const getProductsController = async (req, res) => {
    try {
        const user = req.user ? await userModel.findById(req.user._id) : null;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        const { items, total, currentPage, totalPages, hasMore } = await paginate(ProductModel, {}, page, limit, "category");

        const updatedProducts = items.map(p => ({
            ...p.toObject(),
            isLiked: user ? user.likedProducts.includes(p.id) : false,
        }));

        res.status(200).send({
            success: true,
            message: updatedProducts.length ? "Products fetched successfully" : "No more products",
            total,
            currentPage,
            totalPages,
            hasMore,
            products: updatedProducts,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Error in getting products", error: error.message });
    }
};

// ------------------------- GET SINGLE PRODUCT -------------------------
export const getSingleProductsController = async (req, res) => {
    try {
        const user = req.user ? await userModel.findById(req.user._id) : null;
        const product = await ProductModel.findOne({ id: req.params.id }).populate("category");

        if (!product) return res.status(404).send({ success: false, message: "Product not found" });

        const productWithLikeStatus = {
            ...product.toObject(),
            isLiked: user ? user.likedProducts.includes(product.id) : false,
        };

        res.status(200).send({ success: true, message: "Single Product Fetched Successfully", product: productWithLikeStatus });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error Getting Single Product", error });
    }
};

// ------------------------- DELETE PRODUCT -------------------------
export const deleteProductController = async (req, res) => {
    try {
        const product = await ProductModel.findOne({ id: req.params.id });
        if (product.images && product.images.length) {
            for (let imgUrl of product.images) {
                const publicId = imgUrl.split("/").slice(-2).join("/").split(".")[0];
                await cloudinary.v2.uploader.destroy(`ecommerce_products/${publicId}`);
            }
        }
        await ProductModel.findOneAndDelete({ id: req.params.id });
        res.status(200).send({ success: true, message: "Product Deleted Successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error Deleting Product", error });
    }
};

// ------------------------- UPDATE PRODUCT -------------------------
export const updateProductController = async (req, res) => {
    try {
        const { name, description, price, quantity, category, shipping, categoryName, ratings } = req.fields;
        const { images } = req.files || {}; // multiple files

        switch (true) {
            case !name: return res.status(400).send({ error: "Name is Required" });
            case !description: return res.status(400).send({ error: "Description is Required" });
            case !price: return res.status(400).send({ error: "Price is Required" });
            case !quantity: return res.status(400).send({ error: "Quantity is Required" });
            case !category: return res.status(400).send({ error: "Category ID is Required" });
            case !ratings: return res.status(400).send({ error: "Ratings is Required" });
        }

        const product = await ProductModel.findOne({ id: req.params.id });

        if (images && images.length) {
            if (product.images && product.images.length) {
                for (let imgUrl of product.images) {
                    const publicId = imgUrl.split("/").slice(-2).join("/").split(".")[0];
                    await cloudinary.v2.uploader.destroy(`ecommerce_products/${publicId}`);
                }
            }

            const imageUrls = [];
            for (let img of images) {
                const result = await cloudinary.v2.uploader.upload(img.path, { folder: "ecommerce_products" });
                imageUrls.push(result.secure_url);
            }
            product.images = imageUrls;
        }

        product.name = name;
        product.slug = slugify(name);
        product.description = description;
        product.price = price;
        product.quantity = quantity;
        product.category = category;
        product.shipping = shipping;
        product.categoryName = categoryName || (await Categorymodel.findById(category)).name;
        product.ratings = ratings

        await product.save();
        res.status(200).send({ success: true, message: "Product Updated Successfully", product });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error in Updating product", error });
    }
};

// ------------------------- PRODUCTS BY CATEGORY -------------------------
export const productPerCategoryController = async (req, res) => {
  try {
    const user = req.user ? await userModel.findById(req.user._id) : null;
    const category = await Categorymodel.findOne({ slug: req.params.slug });
    if (!category) return res.status(404).send({ success: false, message: "Category not found" });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const { items, total, currentPage, totalPages, hasMore } = await paginate(
      ProductModel,
      { category: category._id },
      page,
      limit,
      "category"
    );

    const updatedProducts = items.map(p => ({
      ...p.toObject(),
      isLiked: user ? user.likedProducts.includes(p.id) : false
    }));

    res.status(200).send({
      success: true,
      message: updatedProducts.length ? "Products fetched successfully" : "No more products",
      category,
      total,
      currentPage,
      totalPages,
      hasMore,
      products: updatedProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Error in getting products by category", error: error.message });
  }
};

// ------------------------- SEARCH PRODUCTS -------------------------
export const searchProductController = async (req, res) => {
  try {
    const user = req.user ? await userModel.findById(req.user._id) : null;
    const { keyword } = req.params;

    const results = await ProductModel.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } }
      ]
    }).populate("category");

    const updatedResults = results.map(p => ({
      ...p.toObject(),
      isLiked: user ? user.likedProducts.includes(p.id) : false
    }));

    res.status(200).send({
      success: true,
      message: updatedResults.length ? "Products fetched successfully" : "No products found",
      total: updatedResults.length,
      products: updatedResults
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Error in getting searched products", success: false, error });
  }
};

// ------------------------- SIMILAR PRODUCTS -------------------------
export const similarProductsController = async (req, res) => {
  try {
    const user = req.user ? await userModel.findById(req.user._id) : null;
    const { pid, cid } = req.params;

    const products = await ProductModel.find({
      category: cid,
      id: { $ne: parseInt(pid) } // use id instead of _id
    }).populate("category").limit(12);

    const updatedProducts = products.map(p => ({
      ...p.toObject(),
      isLiked: user ? user.likedProducts.includes(p.id) : false
    }));

    res.status(200).send({
      success: true,
      message: updatedProducts.length ? "Products fetched successfully" : "No more products",
      products: updatedProducts,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Error in fetching similar products", success: false, error });
  }
};

// ------------------------- FILTER PRODUCTS -------------------------
export const productFiltersController = async (req, res) => {
  try {
    const user = req.user ? await userModel.findById(req.user._id) : null;
    const { checked, radio } = req.query;
    let args = {};
    if (checked && checked.length > 0) args.category = checked;
    if (radio && radio.length) args.price = { $gte: radio[0], $lte: radio[1] };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const { items, total, currentPage, totalPages, hasMore } = await paginate(
      ProductModel,
      args,
      page,
      limit,
      "category"
    );

    const updatedProducts = items.map(p => ({
      ...p.toObject(),
      isLiked: user ? user.likedProducts.includes(p.id) : false
    }));

    res.status(200).send({
      success: true,
      message: updatedProducts.length ? "Products fetched successfully" : "No more products",
      total,
      currentPage,
      totalPages,
      hasMore,
      products: updatedProducts
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({ success: false, message: "Error while filtering products", error });
  }
};

// ------------------------- PRODUCT COUNT -------------------------
export const productCountController = async (req, res) => {
  try {
    const total = await ProductModel.countDocuments();
    res.status(200).send({ success: true, total });
  } catch (error) {
    console.log(error);
    res.status(400).send({ success: false, message: "Error in getting product count", error });
  }
};

// ------------------------- PAYMENT -------------------------
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) res.status(500).send(err);
      else res.send(response);
    });
  } catch (error) {
    console.log(error);
  }
};

export const braintreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;
    let total = cart.reduce((acc, item) => acc + item.price, 0);

    gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: { submitForSettlement: true }
      },
      async (error, result) => {
        if (result) {
          await new OrderModel({ products: cart, payment: result, buyer: req.user._id }).save();
          res.json({ ok: true });
        } else {
          res.status(500).send(error);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
