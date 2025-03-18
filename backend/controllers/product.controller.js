import { Product, SubCategory } from "../models/product.model.js";
import { errorHandler } from "../utils/error.js";
import fs from 'fs';
import path from 'path';

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

export const deleteProduct = async (req,res,next) => {
    try {
        const {productId} = req.params
        const deletedProduct = await Product.findByIdAndDelete(productId)

        if(!deletedProduct){
            return next(errorHandler(404, 'Product not found'))
        }
        res.status(200).json({message:'Deleted product successfully'})
    } catch (error) {
        next(error)
    }
}

export const updateProduct = async (req,res,next) => {
    try {
        const {productId} = req.params;
        const { productname, productprice, producttax, productprinter } = req.body;

        let updateData = {
            productname,
            productprice,
            producttax,
            productprinter
        };

        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });

        if (!updatedProduct) {
            return next(errorHandler(404, 'Product not found'));
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        if (error.code === 11000) {
            return next(errorHandler(400, 'Product name already exists'));
        }
        next(error);
    }
}

export const deleteSubCategory = async (req, res, next) => {
    try {
        const { subcategoryId } = req.params;

        // 删除与该 SubCategory 关联的所有 Product
        await Product.deleteMany({ productsub: subcategoryId });

        // 删除 SubCategory
        const deletedSubCategory = await SubCategory.findByIdAndDelete(subcategoryId);

        if (!deletedSubCategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }

        res.status(200).json({ message: 'SubCategory and associated products deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const updateSubCategory = async (req, res, next) => {
    try {
        const { subcategoryId } = req.params;
        const { name } = req.body;

        // 检查新的子分类名称是否已经存在
        const existingSubCategory = await SubCategory.findOne({ name });
        if (existingSubCategory && existingSubCategory._id.toString() !== subcategoryId) {
            return res.status(400).json({ message: 'Sub category name is already exists' });
        }

        // 更新子分类名称
        const updatedSubCategory = await SubCategory.findByIdAndUpdate(
            subcategoryId,
            { name },
            { new: true }
        );

        if (!updatedSubCategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }

        res.status(200).json(updatedSubCategory);
    } catch (error) {
        next(error);
    }
};