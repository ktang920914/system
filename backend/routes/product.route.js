import express from 'express';
import { createProduct, createSubCategory, deleteProduct, 
    deleteSubCategory, getProducts, getSubCategories, updateProduct,
    updateSubCategory} from '../controllers/product.controller.js';

const router = express.Router();

router.post('/create-product', createProduct);
router.post('/create-sub-category', createSubCategory);
router.get('/get-products', getProducts);
router.get('/get-sub-categories', getSubCategories);
router.delete('/delete-product/:productId', deleteProduct);
router.put('/update-product/:productId', updateProduct);
router.delete('/delete-subcategory/:subcategoryId', deleteSubCategory)
router.put('/update-subcategory/:subcategoryId', updateSubCategory); // 新增的路由

export default router;