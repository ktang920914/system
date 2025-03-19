// models/Stock.js
import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
    productname: {
        type: String,
        required: true,
    },
    stockcode: {
        type: String,
        required: true,
    },
    stockquantity: {
        type: Number,
        required: true,
    },
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
    },
    lastActionType: {
        type: String,
        enum: ['in', 'out'],
        default: 'in',
    },
}, { timestamps: true });

const Stock = mongoose.model('Stock', stockSchema);

export default Stock;