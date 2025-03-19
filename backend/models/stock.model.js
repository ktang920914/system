import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
    productname: {
        type: String,
        required: true,
    },
    stockcode: {
        type: String,
        required: true,
        unique: true,
    },
    stockquantity: {
        type: Number,
        required: true,
    },
    warehouse: {
        type: mongoose.Schema.Types.ObjectId, // 引用 Inventory 模型
        ref: 'Inventory',
    },
}, { timestamps: true });

const Stock = mongoose.model('Stock', stockSchema);

export default Stock;