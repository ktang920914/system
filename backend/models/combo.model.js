import mongoose from "mongoose";

const comboSchema = new mongoose.Schema({
    comboName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    option: {
        type: Number,
        required: true,
    },
    productDetails: [{
        productname: {
            type: String,
            required: true,
        },
        comboquantity: {
            type: Number,
            required: true,
        },
    }],
}, { timestamps: true });

const Combo = mongoose.model('Combo', comboSchema);

export default Combo;