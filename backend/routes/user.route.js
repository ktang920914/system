import express from 'express'
import { getUser, signout, updateUser } from '../controllers/user.controller.js'
import { verifyToken } from '../utils/verify.user.js'

const router = express.Router()

router.post('/signout', signout)
router.put('/update/:userId', verifyToken, updateUser)
router.get('/get-user', getUser)

export default router