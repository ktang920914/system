import { errorHandler } from "../utils/error.js"
import Inventory from "../models/inventory.model.js"

export const createWarehouse = async (req,res,next) => {
    try {
        const {warehousename, description} = req.body

        const existingWarehousename = await Inventory.findOne({warehousename})

        if(existingWarehousename){
            return next(errorHandler(400, 'Warehouse name is already exists'))
        }

        const newWarehouse = new Inventory({
            warehousename,
            description
        })
        await newWarehouse.save()
        res.status(201).json({message:'Success'})
    } catch (error) {
        next(error)
    }
}

export const getWarehouses = async (req,res,next) => {
    try {
        const warehouses = await Inventory.find().sort({updatedAt: -1})
        res.status(200).json(warehouses)
    } catch (error) {
        next(error)
    }
}

export const updateWarehouse = async (req,res,next) => {
    try {
        const {inventoryId} = req.params
        const {warehousename, description} = req.body

        const existingWarehousename = await Inventory.findOne({warehousename})
        if(existingWarehousename){
            return next(errorHandler(400, 'Warehouse name is already exists'))
        }

        const updatedWarehouse = await Inventory.findByIdAndUpdate(inventoryId,{
                warehousename,
                description:description
        },{new:true})

        res.status(200).json(updatedWarehouse)
    } catch (error) {
        next(error)
    }
}

export const deleteWarehouse = async (req,res,next) => {
    try {
        const {inventoryId} = req.params
        const deletedWarehouse = await Inventory.findByIdAndDelete(inventoryId);
        if (!deletedWarehouse) {
            return next(errorHandler(404, 'Warehouse not found'));
        }
        await res.status(200).json({message:'success'})
    } catch (error) {
        next(error)
    }
}