import express from 'express'
import { createTable, deleteTable, getTables } from '../controllers/table.controller.js'

const router = express.Router()

router.post('/create-table', createTable)
router.get('/get-tables', getTables)
router.delete('/delete-table/:tableId', deleteTable)

export default router