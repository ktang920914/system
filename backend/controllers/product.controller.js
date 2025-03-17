import { Product, SubCategory } from "../models/product.model.js";
import { errorHandler } from "../utils/error.js";

export const createProduct = async (req, res, next) => {
    try {
        const { productcategory, productname, productprice, producttax, productsub } = req.body;

        const existingProductname = await Product.findOne({ productname });

        if (existingProductname) {
            return next(errorHandler(400, 'Product name already exists'));
        }

        const newProduct = new Product({
            productcategory,
            productprice,
            producttax,
            productsub,
            ...req.body
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        next(error);
    }
};

export const createSubCategory = async (req, res, next) => {
    try {
        const { name } = req.body;

        const existingSubCategory = await SubCategory.findOne({ name });

        if (existingSubCategory) {
            return next(errorHandler(400, 'Sub Category already exists'));
        }

        const newSubCategory = new SubCategory({ name });
        await newSubCategory.save();
        res.status(201).json(newSubCategory);
    } catch (error) {
        next(error);
    }
};

export const getSubCategories = async (req, res, next) => {
    try {
        const subCategories = await SubCategory.find().sort({ createdAt: -1 });
        res.status(200).json(subCategories);
    } catch (error) {
        next(error);
    }
};

export const getProducts = async (req, res, next) => {
    try {
        const products = await Product.find({ productname: { $exists: true, $ne: '' } })
            .populate('productsub', 'name')
            .sort({ updatedAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
};