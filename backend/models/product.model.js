import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productcategory:{
        type:String,
        enum:['Single','Combo'],
        required:true,
    },
    productname:{
        type:String,
        required:true,
        unique:true,
    },
    productimage:{
        type:String,
        default:'',
    },
    productprice:{
        type:Number,
        required:true,
    },
    producttax:{
        type:Number,
        required:true,
    },
    quantity:{
        type:Number,
        required:true
    }
},{timestamps:true})

const Product = mongoose.model('Product', productSchema)

export default Product