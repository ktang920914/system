import express from 'express'
import { getReserveReport } from '../controllers/reserve.controller.js'

const router = express.Router()

router.get('/get-reserve-report', getReserveReport)

export default router