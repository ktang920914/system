import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import authRoute from './routes/auth.route.js';
import userRoute from './routes/user.route.js';
import areaRoute from './routes/area.route.js';
import tableRoute from './routes/table.route.js';
import productRoute from './routes/product.route.js';
import printerRoute from './routes/printer.route.js';
import inventoryRoute from './routes/inventory.route.js'

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGO)
    .then(() => console.log('MongoDB is connected'))
    .catch((err) => console.log(err));

app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/area', areaRoute);
app.use('/api/table', tableRoute);
app.use('/api/product', productRoute);
app.use('/api/printer', printerRoute);
app.use('/api/inventory', inventoryRoute);

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