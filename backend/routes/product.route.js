import express from 'express';
import { createProduct, createSubCategory, getProducts, getSubCategories } from '../controllers/product.controller.js';

const router = express.Router();

router.post('/create-product', createProduct);
router.post('/create-sub-category', createSubCategory);
router.get('/get-products', getProducts);
router.get('/get-sub-categories', getSubCategories);

export default router;