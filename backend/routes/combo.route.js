import express from 'express'
import { createCombo, deleteCombo, getCombos, updateCombo } from '../controllers/combo.controller.js'

const router = express.Router()

router.post('/create-combo', createCombo)
router.get('/get-combos', getCombos)
router.put('/update-combo/:comboId', updateCombo)
router.delete('/delete-combo/:comboId', deleteCombo)

export default router