import express from 'express'
import { createWarehouse, deleteWarehouse, getWarehouses, updateWarehouse } from '../controllers/inventory.controller.js'

const router = express.Router()

router.post('/create-warehouse', createWarehouse)
router.get('/get-warehouses', getWarehouses)
router.put('/update-warehouse/:inventoryId', updateWarehouse)
router.delete('/delete-warehouse/:inventoryId', deleteWarehouse)

export default router