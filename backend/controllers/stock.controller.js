import { errorHandler } from '../utils/error.js';
import { Product } from "../models/product.model.js";
import  Stock from "../models/stock.model.js";

export const createStock = async (req, res, next) => {
    try {
        const { productname, stockcode, stockquantity, warehouse } = req.body;
        const product = await Product.findOne({ productname });
        if (!product) {
            return next(errorHandler(404, 'Product not found'));
        }
        const stock = new Stock({
            productname,
            stockcode,
            stockquantity,
            warehouse, // 存储 Inventory 的 ObjectId
            product: product._id,
        });
        await stock.save();
        res.status(201).json(stock);
    } catch (error) {
        next(error);
    }
};

export const getStock = async (req, res, next) => {
    try {
        const stocks = await Stock.find()
            .populate('warehouse', 'warehousename')
            .sort({ updatedAt: -1 });
        res.status(200).json(stocks);
    } catch (error) {
        next(error);
    }
};

export const updateStock = async (req, res, next) => {
    try {
        const { type } = req.body;
        const stock = await Stock.findById(req.params.stockId);
        if (!stock) {
            return next(errorHandler(404, 'Stock not found'));
        }
        const product = await Product.findOne({ productname: stock.productname });
        if (!product) {
            return next(errorHandler(404, 'Product not found'));
        }

        // 根据类型更新 productquantity
        if (type === 'in') {
            product.productquantity -= stock.stockquantity; // 增加
        } else if (type === 'out') {
            product.productquantity += stock.stockquantity; // 减少
        }

        // 更新 lastActionType
        stock.lastActionType = type;
        await stock.save();
        await product.save();

        res.status(200).json(stock);
    } catch (error) {
        next(error);
    }
};

export const deleteStock = async (req, res, next) => {
    try {
        const stock = await Stock.findByIdAndDelete(req.params.stockId);
        if (!stock) {
            return next(errorHandler(404, 'Stock not found'));
        }
        res.status(200).json('Stock deleted successfully');
    } catch (error) {
        next(error);
    }
};