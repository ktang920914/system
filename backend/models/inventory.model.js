import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
    warehousename:{
        type:String,
        unique:true,
        required:true,
    },
    description:{
        type:String,
        default:''
    }
},{timestamps:true})

const Inventory = mongoose.model('Inventory', inventorySchema)

export default Inventory