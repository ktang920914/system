import Combo from '../models/combo.model.js';
import {Product} from '../models/product.model.js';
import { errorHandler } from '../utils/error.js';

export const createCombo = async (req, res, next) => {
    try {
        const { comboName, option, chooseNumber, productDetails } = req.body;

        // Validate chooseNumber
        if (chooseNumber > option) {
            return next(errorHandler(400, 'Choose number cannot be greater than option'));
        }

        const existingComboname = await Combo.findOne({comboName})
        if(existingComboname){
            return next(errorHandler(400, 'Combo is already exists'))
        }
        
        const product = await Product.findById(comboName);
        if (!product || product.productcategory !== 'Combo') {
            return next(errorHandler(400, 'Invalid combo product'));
        }

        if (!Array.isArray(productDetails) || productDetails.length === 0) {
            return next(errorHandler(400, 'Product details must be a non-empty array'));
        }

        const newCombo = new Combo({
            comboName,
            comboprice: product.productprice, // Add the price from the product
            option,
            chooseNumber,
            productDetails,
        });

        await newCombo.save();
        res.status(201).json(newCombo);
    } catch (error) {
        next(error);
    }
};

export const getCombos = async (req, res, next) => {
    try {
        const combos = await Combo.find().populate('comboName', 'productname productprice').sort({ createdAt: -1 });
        res.status(200).json(combos);
    } catch (error) {
        next(error);
    }
};

export const updateCombo = async (req, res, next) => {
    try {
        const { comboId } = req.params;
        const { comboName, option, chooseNumber, productDetails } = req.body;

        // Validate chooseNumber
        if (chooseNumber > option) {
            return next(errorHandler(400, 'Choose number cannot be greater than option'));
        }

        // Get the product price if comboName is being updated
        let updateData = {
            option,
            chooseNumber,
            productDetails
        };

        if (comboName) {
            const product = await Product.findById(comboName);
            if (!product || product.productcategory !== 'Combo') {
                return next(errorHandler(400, 'Invalid combo product'));
            }
            updateData.comboName = comboName;
            updateData.comboprice = product.productprice;
        }

        const updatedCombo = await Combo.findByIdAndUpdate(
            comboId,
            updateData,
            { new: true }
        );

        if (!updatedCombo) {
            return next(errorHandler(404, 'Combo not found'));
        }

        res.status(200).json(updatedCombo);
    } catch (error) {
        next(error);
    }
};

export const deleteCombo = async (req, res, next) => {
    try {
        const { comboId } = req.params;
        const deletedCombo = await Combo.findByIdAndDelete(comboId);

        if (!deletedCombo) {
            return next(errorHandler(404, 'Combo not found'));
        }

        res.status(200).json({ message: 'Combo deleted successfully' });
    } catch (error) {
        next(error);
    }
};