import mongoose from "mongoose";

const areaSchema = new mongoose.Schema({
    areaname:{
        type:String,
        required:true,
        unique:true,
    },
    description:{
        type:String,
        default:''
    },
    category:{
        type:String,
        default:'Uncategory'
    }
},{timestamps:true})

const Area = mongoose.model('Area', areaSchema)

export default Area