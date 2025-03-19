import express from 'express'
import { createStock, deleteStock, getStock, updateStock } from '../controllers/stock.controller.js'

const router = express.Router()

router.post('/create-stock', createStock)
router.get('/get-stocks', getStock)
router.put('/update-stock/:stockId', updateStock)
router.delete('/delete-stock/:stockId', deleteStock)

export default router