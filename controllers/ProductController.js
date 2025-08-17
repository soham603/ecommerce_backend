import ProductModel from "../models/ProductModel.js";
import Categorymodel from "../models/CateogyModel.js";
import OrderModel from "../models/OrderModel.js";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";
import cloudinary from "../config/cloudinary.js";
import userModel from "../models/userModel.js";
import { paginate } from "../middlewares/pagination.js";

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
    const { name, description, price, quantity, category, shipping, categoryName } = req.fields;
    const { image } = req.files || {};

    switch (true) {
      case !name: return res.status(400).send({ error: "Name is Required" });
      case !description: return res.status(400).send({ error: "Description is Required" });
      case !price: return res.status(400).send({ error: "Price is Required" });
      case !quantity: return res.status(400).send({ error: "Quantity is Required" });
      case !category: return res.status(400).send({ error: "Category ID is Required" });
    }

    let imageUrl = "";
    if (image) {
      const result = await cloudinary.v2.uploader.upload(image.path, { folder: "ecommerce_products" });
      imageUrl = result.secure_url;
    }

    const products = new ProductModel({
      ...req.fields,
      slug: slugify(name),
      image: imageUrl,
      categoryName: categoryName || (await Categorymodel.findById(category)).name,
    });

    await products.save();
    res.status(201).send({ success: true, message: "Product Added Successfully", products });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error in creating product", error });
  }
};

// ------------------------- GET ALL PRODUCTS -------------------------
export const getProductsController = async (req, res) => {
  try {
    const user = req.user ? await userModel.findById(req.user._id) : null;

    console.log(user);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const { items, total, currentPage, totalPages, hasMore } = await paginate(
      ProductModel,
      {},
      page,
      limit,
      "category"
    );

    const updatedProducts = items.map(p => ({
      ...p.toObject(),
      isLiked: user ? user.likedProducts.includes(p._id) : false,
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
// Updated getSingleProductsController in ProductController.js
export const getSingleProductsController = async (req, res) => {
  try {
    const user = req.user ? await userModel.findById(req.user._id) : null;
    const product = await ProductModel.findOne({ slug: req.params.slug }).populate("category");
    
    if (!product) {
      return res.status(404).send({ 
        success: false, 
        message: "Product not found" 
      });
    }

    // Add isLiked field based on user login status
    const productWithLikeStatus = {
      ...product.toObject(),
      isLiked: user ? user.likedProducts.includes(product._id) : false,
    };

    res.status(200).send({ 
      success: true, 
      message: "Single Product Fetched Successfully", 
      product: productWithLikeStatus 
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ 
      success: false, 
      message: "Error Getting Single Product", 
      error 
    });
  }
};

// ------------------------- DELETE PRODUCT -------------------------
export const deleteProductController = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.pid);
    if (product.image) {
      const publicId = product.image.split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.v2.uploader.destroy(`ecommerce_products/${publicId}`);
    }
    await ProductModel.findByIdAndDelete(req.params.pid);
    res.status(200).send({ success: true, message: "Product Deleted Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error Deleting Product", error });
  }
};

// ------------------------- UPDATE PRODUCT -------------------------
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, quantity, category, shipping, categoryName } = req.fields;
    const { photo } = req.files || {};

    switch (true) {
      case !name: return res.status(400).send({ error: "Name is Required" });
      case !description: return res.status(400).send({ error: "Description is Required" });
      case !price: return res.status(400).send({ error: "Price is Required" });
      case !quantity: return res.status(400).send({ error: "Quantity is Required" });
      case !category: return res.status(400).send({ error: "Category ID is Required" });
    }

    const product = await ProductModel.findById(req.params.pid);

    if (photo) {
      if (product.image) {
        const publicId = product.image.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.v2.uploader.destroy(`ecommerce_products/${publicId}`);
      }
      const result = await cloudinary.v2.uploader.upload(photo.path, { folder: "ecommerce_products" });
      product.image = result.secure_url;
    }

    product.name = name;
    product.slug = slugify(name);
    product.description = description;
    product.price = price;
    product.quantity = quantity;
    product.category = category;
    product.shipping = shipping;
    product.categoryName = categoryName || (await Categorymodel.findById(category)).name;

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

    const updatedProducts = items.map(p => ({ ...p.toObject(), isLiked: user ? user.likedProducts.includes(p._id) : false }));

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
export const searchProductController = async (req,res) => {
  try {
    const user = req.user ? await userModel.findById(req.user._id) : null;
    const {keyword} = req.params;

    const results = await ProductModel.find({
      $or: [
        {name: {$regex: keyword, $options: "i"}},
        {description: {$regex: keyword, $options: "i"}}
      ]
    }).populate("category");

    const updatedResults = results.map(p => ({ ...p.toObject(), isLiked: user ? user.likedProducts.includes(p._id) : false }));

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
export const similarProductsController = async (req,res) => {
  try {
    const user = req.user ? await userModel.findById(req.user._id) : null;
    const {pid,cid} = req.params;

    const products = await ProductModel.find({
      category: cid,
      _id: {$ne: pid},
    }).populate("category").limit(12);

    const updatedProducts = products.map(p => ({ ...p.toObject(), isLiked: user ? user.likedProducts.includes(p._id) : false }));

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
export const productFiltersController = async(req,res) => {
  try {
    const user = req.user ? await userModel.findById(req.user._id) : null;
    const {checked, radio} = req.query;
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

    const updatedProducts = items.map(p => ({ ...p.toObject(), isLiked: user ? user.likedProducts.includes(p._id) : false }));

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
export const productCountController = async (req,res) => {
  try {
    const total = await ProductModel.countDocuments();
    res.status(200).send({ success: true, total });
  } catch (error) {
    console.log(error);
    res.status(400).send({ success: false, message: "Error in getting product count", error });
  }
};

// ------------------------- PAYMENT -------------------------
export const braintreeTokenController = async (req,res) => {
  try {
    gateway.clientToken.generate({}, function(err,response){
      if(err) res.status(500).send(err);
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
