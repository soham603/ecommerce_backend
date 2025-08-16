import CategoryModel from "../models/CateogyModel.js";
import slugify from "slugify";
import cloudinary from "../config/cloudinary.js";

export const createCategoryController = async (req, res) => {
    try {
      const { name } = req.fields;
      const { image } = req.files || {};
  
      if (!name) {
        return res.status(400).send({ message: "Name is Required" });
      }
  
      const existingCategory = await CategoryModel.findOne({ name });
      if (existingCategory) {
        return res.status(200).send({
          success: true,
          message: "Category Already Exists",
        });
      }
  
      let photoUrl = "";
      if (image) {
        const result = await cloudinary.v2.uploader.upload(image.path, {
          folder: "ecommerce_categories",
        });
        photoUrl = result.secure_url;
      } else {
        return res.status(400).send({ message: "Category Image is required" });
      }
  
      const categorynew = await new CategoryModel({
        name,
        slug: slugify(name),
        image: photoUrl,
      }).save();
  
      res.status(201).send({
        success: true,
        message: "New Category Created Successfully",
        categorynew,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error in Category",
        error,
      });
    }
  };
  
  // Update Category
  export const updateCategoryController = async (req, res) => {
    try {
      const { name } = req.fields;
      const { id } = req.params;
      const { image } = req.files || {};
  
      if (name) {
        const alreadyCategory = await CategoryModel.findOne({
          name,
          _id: { $ne: id },
        });
        if (alreadyCategory) {
          return res.status(400).send({
            success: false,
            message: "Category Name Already Exists",
          });
        }
      }

      let updateData = {};
      if (name) updateData.name = name;
      if (name) updateData.slug = slugify(name);
  
      if (image) {
        const existingCategory = await CategoryModel.findById(id);
        if (!existingCategory) {
        return res.status(404).send({
            success: false,
            message: "Category not found",
        });
        }

        if (existingCategory.image) {
            const publicId = existingCategory.image
              .split('/')
              .slice(-1)[0] 
              .split('.')[0];
    
            console.log(`Removing Item : ${publicId}`);
            await cloudinary.v2.uploader.destroy(`ecommerce_categories/${publicId}`);
          }

        const result = await cloudinary.v2.uploader.upload(image.path, {
          folder: "ecommerce_categories",
        });
        updateData.image = result.secure_url;
      }
  
      const category = await CategoryModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });
  
      if (!category) {
        return res.status(404).send({
          success: false,
          message: "Category not found",
        });
      }
  
      res.status(200).send({
        success: true,
        message: "Category Updated Successfully",
        category,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error while updating category",
        error,
      });
    }
  };  
  
  // Get All Categories
  export const getallCategoriesController = async (req, res) => {
    try {
      const categoryall = await CategoryModel.find({});
      res.status(200).send({
        success: true,
        message: "All Categories Listed",
        categoryall,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error while fetching categories",
        error,
      });
    }
  };
  
  // Get Single Category
  export const getsingleCategoriesController = async (req, res) => {
    try {
      const category = await CategoryModel.findOne({ slug: req.params.slug });
      res.status(200).send({
        success: true,
        message: "Get Single Category Successfully",
        category,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error while getting single category",
        error,
      });
    }
  };
  
  // Delete Category
  export const deleteCategoryController = async (req, res) => {
    try {
      const { id } = req.params;
      await CategoryModel.findByIdAndDelete(id);
      res.status(200).send({
        success: true,
        message: "Category Deleted Successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error while deleting category",
        error,
      });
    }
  };