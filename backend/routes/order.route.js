import express from 'express'
import { createOrder, deleteOrder, getOrders, updateOrder, updateOrderTotals } from '../controllers/order.controller.js'

const router = express.Router()

router.post('/create-order', createOrder)
router.get('/get-orders', getOrders)
router.put('/update-order/:ordernumber', updateOrder)
router.delete('/delete-order/:orderId', deleteOrder)
router.put('/update-order-totals/:ordernumber', updateOrderTotals)  // 新增路由

export default router