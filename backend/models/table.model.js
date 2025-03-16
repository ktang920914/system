import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
    tablename:{
        type:String,
        required:true,
        unique:true,
    },
    tablepax:{
        type:Number,
        required:true,
    },
    minimumspent:{
        type:Number,
        required:true,
    },
    area:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Area',
        required: true,
    },
    reserve:{
        status:{
            type:Boolean,
            default:false,
        },
        timestamp:{
            type:Date,
            default:null,
        },
        customername:{
            type:String,
        },
        phonenumber:{
            type:String,
        },
        pax:{
            type:Number,
        },
    },
    open:{
        status:{
            type:Boolean,
            default:false,
        },
        timestamp:{
            type:Date,
            default:null,
        },
        customername:{
            type:String,
        },
        phonenumber:{
            type:String,
        },
        pax:{
            type:Number,
        },
    },
    close:{
        status:{
            type:Boolean,
            default:false,
        },
        timestamp:{
            type:Date,
            default:null,
        },
        customername:{
            type:String,
        },
        phonenumber:{
            type:String,
        },
        pax:{
            type:Number,
        },
    },
    disabled: {
        type: Boolean,
        default: false,
    },
},{timestamps:true})
const Table = mongoose.model('Table', tableSchema)

export default Table