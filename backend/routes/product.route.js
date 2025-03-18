import express from 'express';
import { createProduct, createSubCategory, deleteProduct, getProducts, getSubCategories, updateProduct } from '../controllers/product.controller.js';

const router = express.Router();

router.post('/create-product', createProduct);
router.post('/create-sub-category', createSubCategory);
router.get('/get-products', getProducts);
router.get('/get-sub-categories', getSubCategories);
router.delete('/delete-product/:productId', deleteProduct);
router.put('/update-product/:productId', updateProduct);

export default router;