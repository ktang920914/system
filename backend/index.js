import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import authRoute from './routes/auth.route.js';
import userRoute from './routes/user.route.js';
import areaRoute from './routes/area.route.js';
import tableRoute from './routes/table.route.js';
import productRoute from './routes/product.route.js';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Multer 配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads')); // 文件保存到 uploads 目录
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname); // 生成唯一的文件名
    }
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(cookieParser());

// 设置静态文件目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO)
    .then(() => console.log('MongoDB is connected'))
    .catch((err) => console.log(err));

app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/area', areaRoute);
app.use('/api/table', tableRoute);
app.use('/api/product', productRoute);

// 文件上传路由
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ filePath: `/uploads/${req.file.filename}` });
});

app.get('/', (req, res) => {
    res.send('<h1>Welcome to backend system</h1>');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        statusCode,
        message
    });
});