import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    table:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Table',
        required:true,
    },
    ordernumber:{
        type:String,
        required:true,
        unique:true,
    },
    orderitems:[{
        orderproductname:{
            type:String,
            required:true,
        },
        orderproductquantity:{
            type:Number,
            required:true,
        },
        orderproductprice:{
            type:Number,
            required:true,
        },
    }],
    ordercomboitem:[{
        comboproductitem:{
            type:String,
            required:true,
        },
        comboproductquantity:{
            type:Number,
            required:true,
        },
    }],
    ordertax:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required:true,
    },
    servicetax:{
        type:Number,
        default:8
    }
},{timestamps:true})

const Order = mongoose.model('Order', orderSchema)

export default Order