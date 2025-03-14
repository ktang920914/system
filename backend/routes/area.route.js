import express from 'express'
import { createArea, deleteArea, getAreas, updateArea } from '../controllers/area.controller.js'

const router = express.Router()

router.post('/create-area', createArea)
router.get('/get-areas', getAreas)
router.delete('/delete-area/:areaId', deleteArea)
router.put('/update-area/:areaId', updateArea)

export default router