import express from 'express'
import { createOrder, deleteOrder, getOrders, updateOrder } from '../controllers/order.controller.js'

const router = express.Router()

router.post('/create-order', createOrder)
router.get('/get-orders', getOrders)
router.put('/update-order/:orderId', updateOrder)
router.delete('/delete-order/:orderId', deleteOrder)

export default router