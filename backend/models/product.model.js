import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
}, { timestamps: true });

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

const productSchema = new mongoose.Schema({
    productcategory: {
        type: String,
        enum: ['Single', 'Combo'],
    },
    productsub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true,
    },
    productname: {
        type: String,
        required: true,
        unique: true,
    },
    productimage: {
        type: String,
        default: '',
    },
    productprice: {
        type: Number,
        required: true,
    },
    producttax: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

export { Product, SubCategory };