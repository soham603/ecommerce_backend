import ProductModel from "../models/ProductModel.js";
import Categorymodel from "../models/CateogyModel.js";
import OrderModel from "../models/OrderModel.js";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";
import cloudinary from "../config/cloudinary.js";

dotenv.config();

// Payment Gateway
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
})

export const createProductController = async (req, res) => {
  try {
    const { name, description, price, quantity, category, shipping, categoryName } = req.fields;
    const { image } = req.files || {};

    // Validation
    switch (true) {
      case !name:
        return res.status(400).send({ error: "Name is Required" });
      case !description:
        return res.status(400).send({ error: "Description is Required" });
      case !price:
        return res.status(400).send({ error: "Price is Required" });
      case !quantity:
        return res.status(400).send({ error: "Quantity is Required" });
      case !category:
        return res.status(400).send({ error: "Category ID is Required" });
    }

    let imageUrl = "";
    if (image) {
      // if (image.size > 1000000) {
      //   return res.status(400).send({ error: "Photo should be less than 1MB" });
      // }
      const result = await cloudinary.v2.uploader.upload(image.path, {
        folder: "ecommerce_products",
      });
      imageUrl = result.secure_url;
    }

    const products = new ProductModel({
      ...req.fields,
      slug: slugify(name),
      image: imageUrl,
      categoryName: categoryName || (await Categorymodel.findById(category)).name,
    });

    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Added Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in creating product",
      error,
    });
  }
};

// Get All Products
export const getProductsController = async (req, res) => {
  try {
    const productsall = await ProductModel.find({})
      .populate("category")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      message: "All Products Fetched Successfully",
      countTotal: productsall.length,
      productsall,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting products",
      error,
    });
  }
};

// Get Single Product
export const getSingleProductsController = async (req, res) => {
  try {
    const product = await ProductModel.findOne({ slug: req.params.slug }).populate("category");
    res.status(200).send({
      success: true,
      message: "Single Product Fetched Successfully",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error Getting Single Product",
      error,
    });
  }
};

// Delete Product
export const deleteProductController = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.pid);
    if (product.image) {
      const publicId = product.image.split("/").slice(-2).join("/").split(".")[0];
      console.log(`Removing Item : ${publicId}`);
      await cloudinary.v2.uploader.destroy(`ecommerce_products/${publicId}`);
    }
    await ProductModel.findByIdAndDelete(req.params.pid);
    res.status(200).send({
      success: true,
      message: "Product Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error Deleting Product",
      error,
    });
  }
};

// Update Product
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, quantity, category, shipping, categoryName } = req.fields;
    const { photo } = req.files || {};

    switch (true) {
      case !name:
        return res.status(400).send({ error: "Name is Required" });
      case !description:
        return res.status(400).send({ error: "Description is Required" });
      case !price:
        return res.status(400).send({ error: "Price is Required" });
      case !quantity:
        return res.status(400).send({ error: "Quantity is Required" });
      case !category:
        return res.status(400).send({ error: "Category ID is Required" });
    }

    const product = await ProductModel.findById(req.params.pid);

    if (photo) {
      if (product.image) {
        const publicId = product.image.split("/").slice(-2).join("/").split(".")[0];
        console.log(`Removing Item : ${publicId}`);
        await cloudinary.v2.uploader.destroy(`ecommerce_products/${publicId}`);
      }
      const result = await cloudinary.v2.uploader.upload(photo.path, {
        folder: "ecommerce_products",
      });
      product.image = result.secure_url;
    }

    product.name = name;
    product.slug = slugify(name);
    product.description = description;
    product.price = price;
    product.quantity = quantity;
    product.category = category;
    product.shipping = shipping;
    product.categoryName = categoryName || (await CategoryModel.findById(category)).name;

    await product.save();
    res.status(200).send({
      success: true,
      message: "Product Updated Successfully",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Updating product",
      error,
    });
  }
};

// Product Filter
export const productFiltersController = async(req,res) => {
  try {
    const {checked, radio} = req.query;
    let args = {};
    if (checked && checked.length > 0) args.category = checked;
    if (radio && radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await ProductModel.find(args);
    const lenghtfil = products.length;
    console.log("Lenght of filtered search",products.length);
    res.status(200).send({
      success: true,
      products,
      lenghtfil
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error WHile Filtering Products",
      error,
    });
  }
};

// product count
export const productCountController = async (req,res) => {
  try {
    const total = await ProductModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in getting product count",
      success: false,
      error
    });
  }
}

// Products per page
export const productListPageController = async (req,res) => {
  try {
    const perPage = 9;
    const page = req.params.page ? req.params.page : 1;
    const products = await ProductModel.find({}).select("-photo").skip((page - 1) * perPage).limit(perPage).sort({createdAt: -1});
    res.status(200).send({
      success: true,
      products
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in getting per page products",
      success: false,
      error
    });
  }
};

// search product controller
export const searchProductController = async (req,res) => {
  try {
    const {keyword} = req.params;
    const results = await ProductModel.find({
      $or: [
        {name: {$regex: keyword, $options: "i"}},
        {description: {$regex: keyword, $options: "i"}},
      ],
    }).select("-photo");
    res.json(results);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in getting Searched products",
      success: false,
      error
    });
  }
};

// similar products
export const similarProductsController = async (req,res) => {
  try {
    const {pid,cid} = req.params;
    const products = await ProductModel.find({
      category: cid,
      _id: {$ne:pid},
    }).select("-photo").limit(4).populate("category");
    res.status(200).send({
      success: true,
      message: "Success in similar products",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in getting Searched products",
      success: false,
      error
    });
  }
};


// Products as per category controller
export const productpercategoryController = async (req,res) => {
try{
  const category = await Categorymodel.findOne({ slug: req.params.slug });
  const products = await ProductModel.find({ category }).populate("category");
  res.status(200).send({
    success: true,
    category,
    products,
  })
} catch (error) {
  console.log(error);
  res.status(400).send({
    message: "Error in getting Searched products",
    success: false,
    error
  });
  }
};

// payment api get token from braintree
export const braintreeTokenController = async (req,res) => {
try {
  gateway.clientToken.generate({}, function(err,response){
    if(err){
      res.status(500).send(err);
    } else {
      res.send(response);
    }
  });
} catch (error) {
  console.log(error);
}
};

// payment purpose
export const braintreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;
    let total = 0;
    cart.map((i) => {
      total += i.price;
    });
    let newTransaction = gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      function (error, result) {
        if (result) {
          const order = new OrderModel({
            products: cart,
            payment: result,
            buyer: req.user._id,
          }).save();
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