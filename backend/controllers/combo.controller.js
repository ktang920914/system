import Combo from '../models/combo.model.js';
import {Product} from '../models/product.model.js'; // Import the Product model
import { errorHandler } from '../utils/error.js';

export const createCombo = async (req, res, next) => {
    try {
        const { comboName, option, productDetails } = req.body;

        // Check if the product is of type 'Combo'

        const existingComboname = await Combo.findOne({comboName})
        if(existingComboname){
            return next(errorHandler(400, 'Combo is already exists'))
        }
        const product = await Product.findById(comboName);
        if (!product || product.productcategory !== 'Combo') {
            return next(errorHandler(400, 'Invalid combo product'));
        }

        // Validate productDetails
        if (!Array.isArray(productDetails) || productDetails.length === 0) {
            return next(errorHandler(400, 'Product details must be a non-empty array'));
        }

        // Create the new combo
        const newCombo = new Combo({
            comboName,
            option,
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
        const combos = await Combo.find().populate('comboName', 'productname').sort({ createdAt: -1 });
        res.status(200).json(combos);
    } catch (error) {
        next(error);
    }
};

export const updateCombo = async (req, res, next) => {
    try {
        const { comboId } = req.params;
        const { comboName, option, productDetails } = req.body;

        const updatedCombo = await Combo.findByIdAndUpdate(
            comboId,
            { comboName, option, productDetails },
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