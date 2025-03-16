import mongoose from "mongoose";

const reserveSchema = new mongoose.Schema({

},{timestamps:true})

const Reserve = mongoose.model('Reserve', reserveSchema)

export default Reserve