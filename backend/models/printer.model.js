import mongoose from "mongoose";

const printerSchema = new mongoose.Schema({
  printername: {
    type: String,
    required: true,
    unique: true,
    enum: ['cashier', 'kitchen', 'bar'], // 限制打印机类型
  },
  printerip: {
    type: String,
    required: true,
    match: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // IP地址验证
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});

// 添加虚拟字段
printerSchema.virtual('status').get(function() {
  return this.isActive ? '在线' : '离线';
});

const Printer = mongoose.model('Printer', printerSchema);

export default Printer;