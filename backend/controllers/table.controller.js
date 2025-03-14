import Table from "../models/table.model.js"
import { errorHandler } from "../utils/error.js"

export const createTable = async (req,res,next) => {
    try {
        const {tablenames, tablepax, minimumspent, area} = req.body

        for(const tablename of tablenames){
            const existingTablename = await Table.findOne({tablename})
            if(existingTablename){
                return errorHandler(errorHandler(400, 'Table name is already exsits'))
            }
        }

        const tables = tablenames.map(tablename => ({
            tablename,
            tablepax,
            minimumspent,
            area
        }))
        await Table.insertMany(tables)
        res.status(200).json({message:'Update successfully'})
    } catch (error) {
        next(error)
    }
}

export const getTables = async (req,res,next) => {
    try {
        const tables = await Table.find().sort({updatedAt:-1})
        res.status(200).json(tables)
    } catch (error) {
        next(error)
    }
}

export const deleteTable = async (req,res,next) => {
    try {
        const {tableId} = req.params

        const deletedTable = await Table.findByIdAndDelete(tableId)
        if(!deletedTable){
            return next(errorHandler(404, 'Table not found'))
        }
        res.status(200).json({message:'Table deleted successfully'})
    } catch (error) {
        next(error)
    }
}