import User from "../models/user.model.js"
import { errorHandler } from "../utils/error.js"
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const signup = async (req,res,next) => {
    try {
        const {username, userid, password} = req.body

        const existingName = await User.findOne({username})

        if(existingName){
            return next(errorHandler(400, 'Name is already exists'))
        }

        const existingId = await User.findOne({userid})

        if(existingId){
            return next(errorHandler(400, 'ID is already exists'))
        }

        const hashedPassword = await bcryptjs.hash(password, 10)

        const newUser = new User({
            username,
            userid,
            password: hashedPassword
        })

        await newUser.save()
        res.status(201).json({message:'Signin successfully'})
    } catch (error) {
        next(error)
    }
}

export const signin = async (req,res,next) => {
    try {
        const {userid, password} = req.body

        const validUser = await User.findOne({userid})

        if(!validUser){
            return next(errorHandler(404, 'ID not found'))
        }

        const validPassword = await bcryptjs.compare(password, validUser.password)

        if(!validPassword){
            return next(errorHandler(400, 'Invalid password'))
        }

        const token = jwt.sign({id:validUser._id}, process.env.JWT_SECRET)
        const {password:pass,...rest} = validUser._doc

        res.cookie('access_token', token, {
            httpOnly:true
        })
        res.status(200).json(rest)
    } catch (error) {
        next(error)
    }
}