import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    table:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Table',
    },
    ordernumber:{
        type:String,
        required:true,
        unique:true,
    },
},{timestamps:true})

const Order = mongoose.model('Order', orderSchema)

export default Order