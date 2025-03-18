import mongoose from "mongoose";

const printerSchema = new mongoose.Schema({
    printername: {
        type: String,
        required: true,
        unique: true,
    },
    printerip: {
        type: String,
        unique:true,
        required: true,
    },
    areas: {
        type: [String],
        required: true,
    },
}, { timestamps: true });

const Printer = mongoose.model('Printer', printerSchema);

export default Printer;