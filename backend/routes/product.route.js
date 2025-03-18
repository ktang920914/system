import express from 'express';
import { createProduct, createSubCategory, deleteProduct, getProducts, getSubCategories, updateProduct } from '../controllers/product.controller.js';
import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const router = express.Router();

router.post('/create-product', createProduct);
router.post('/create-sub-category', createSubCategory);
router.get('/get-products', getProducts);
router.get('/get-sub-categories', getSubCategories);
router.delete('/delete-product/:productId', deleteProduct);
router.put('/update-product/:productId', upload.single('productimage'), updateProduct);

export default router;