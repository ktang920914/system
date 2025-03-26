import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    table: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        required: true,
    },
    ordernumber: {
        type: String,
        required: true,
        unique: true,
    },
    orderitems: [{
        orderproductname: {
            type: String,
            required: true,
        },
        orderproductquantity: {
            type: Number,
            required: true,
        },
        orderproductprice: {
            type: Number,
            required: true,
        },
    }],
    ordercomboitem: [{
        comboproductitem: String,
        comboproductquantity: { type: Number, default: 1 },
        comboproductprice: { type: Number, required: true },
        combochooseitems: [{
          combochooseitemname: String,
          combochooseitemquantity: { type: Number, default: 1 }
        }]
      }],
    subtotal: {
        type: Number,
        default: 0,
    },
    ordertotal: {
        type: Number,
        default: 0,
    },
    taxtotal:{
        type:Number,
        default: 0
    },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;