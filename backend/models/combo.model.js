import mongoose from "mongoose";

const comboSchema = new mongoose.Schema({
    comboName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    comboprice: {
        type: Number,
        required: true,
    },
    option: {
        type: Number,
        required: true,
    },
    chooseNumber: {
        type: Number,
        required: true,
        validate: {
            validator: function(value) {
                return value <= this.option;
            },
            message: 'Choose number cannot be greater than option'
        }
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