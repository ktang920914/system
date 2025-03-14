import Area from "../models/area.model.js"
import { errorHandler } from "../utils/error.js"

export const createArea = async (req,res,next) => {
    try {
        const {areaname} = req.body
        const existingAreaname = await Area.findOne({areaname})

        if(existingAreaname){
            return next(errorHandler(400, 'Area name is already exists'))
        }

        const newArea = new Area({
            ...req.body
        })

        await newArea.save()
        res.status(201).json({message:'Update successfully'})
    } catch (error) {
        next(error)
    }
}

export const getAreas = async (req,res,next) => {
    try {
        
        const areas = await Area.find().sort({updatedAt:-1})
        res.status(200).json(areas)
    } catch (error) {
        next(error)
    }
}

export const deleteArea = async (req,res,next) => {
    try {
        const {areaId} = req.params

        const deletedArea = await Area.findByIdAndDelete(areaId)

        if(!deletedArea){
            return next(errorHandler(404, 'Area not found'))
        }
        res.status(200).json({message:'Area deleted successfully'})
    } catch (error) {
        next(error)
    }
}

export const updateArea = async (req,res,next) => {
    try {
        const {areaId} = req.params
        const {areaname, description, category} = req.body

        const updatedArea = await Area.findByIdAndUpdate(areaId, {
            areaname, 
            description, 
            category,
        },{new:true})

        if(!updateArea){
            return next(errorHandler(404, 'Area not found'))
        }
        res.status(200).json(updatedArea)
    } catch (error) {
        next(error)
    }
}