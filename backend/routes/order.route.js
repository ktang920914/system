import express from 'express';
import { 
  createOrder, 
  getOrders, 
  updateOrder, 
  deleteOrder, 
  updateOrderTotals,
  getOrderByTable,
  getOrder
} from '../controllers/order.controller.js';

const router = express.Router();

router.post('/create-order', createOrder);
router.get('/get-orders', getOrders);
router.get('/get-order/:ordernumber', getOrder);
router.put('/update-order/:ordernumber', updateOrder);
router.put('/update-order-totals/:ordernumber', updateOrderTotals);
router.delete('/delete-order/:orderId', deleteOrder);
router.get('/get-order-by-table/:tableId', getOrderByTable);

export default router;