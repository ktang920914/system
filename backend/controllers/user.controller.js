import User from "../models/user.model.js"
import { errorHandler } from "../utils/error.js"
import bcryptjs from 'bcryptjs'

export const signout = async (req,res,next) => {
    try {
        res.clearCookie('access_token')
        res.status(200).json({message:'Signout successfully'})
    } catch (error) {
        next(error)
    }
}

export const updateUser = async (req,res,next) => {
    try {
        if(req.user.id !== req.params.userId){
            return next(errorHandler(403, 'Unauthorized'))
        }

        const {oldpassword, newpassword} = req.body

        const currentUser = await User.findById(req.user.id)

        const validPassword = await bcryptjs.compare(oldpassword, currentUser.password)

        if(!validPassword){
            return next(errorHandler(400, 'Invalid password'))
        }

        const hashedPassword = await bcryptjs.hash(newpassword, 10)

        currentUser.password = hashedPassword
        await currentUser.save()

        res.status(200).json({message:'Update successfully'})
    } catch (error) {
        next(error)
    }
}
