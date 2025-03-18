import express from 'express'
import { cancelReserve, createTable, deleteTable, getDisabledTables, getTables,
     openTable, reserveTable, toggleOpenStatus, updateTable } from '../controllers/table.controller.js'

const router = express.Router()

router.post('/create-table', createTable)
router.get('/get-tables', getTables)
router.delete('/delete-table/:tableId', deleteTable)
router.put('/update-table/:tableId', updateTable)

router.put('/reserve-table/:tableId', reserveTable)
router.put('/cancel-reserve/:tableId', cancelReserve)
router.put('/open-table/:tableId', openTable)
router.put('/toggle-open-status/:tableId', toggleOpenStatus)

router.get('/get-disabled-tables', getDisabledTables)

export default router