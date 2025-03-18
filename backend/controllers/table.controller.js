import Table from "../models/table.model.js"
import { errorHandler } from "../utils/error.js"
import cron from 'node-cron'

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

export const updateTable = async (req,res,next) => {
    try {
        const {tableId} = req.params
        const {tablepax, minimumspent} = req.body

        const updatedTable = await Table.findByIdAndUpdate(tableId, {
            tablepax,
            minimumspent,
        },{new:true})

        if(!updatedTable){
            return next(errorHandler(404, 'Table not found'))
        }
        res.status(200).json(updatedTable)
    } catch (error) {
        next(error)
    }
}

export const reserveTable = async (req,res,next) => {
    try {
        const {tableId} = req.params
        const {customername, phonenumber, pax, reservedate} = req.body

        const table = await Table.findById(tableId)
        if(!table){
            return next(errorHandler(404, 'Table not found'))
        }
        if(table.reserve.status){
            return next(errorHandler(400, 'Table is already reserve'))
        }
        table.reserve = {
            status:true,
            timestamp:new Date(reservedate),
            customername,
            phonenumber,
            pax,
        }
        table.disabled = true
        await table.save()
        res.status(201).json({message:'Reserve successfully'})
    } catch (error) {
        next(error)
    }
}

export const cancelReserve = async (req,res,next) => {
    try {
        const {tableId} = req.params

        const table = await Table.findById(tableId)
        if(!table){
            return next(errorHandler(404, 'Table not found'))
        }
        if(!table.reserve.status){
            return next(errorHandler(400, 'Table is not reserve'))
        }
        table.reserve = {
            status:false,
            timestamp:null,
            customername:null,
            phonenumber:null,
            pax:null
        }
        table.disabled = false
        await table.save()
        res.status(200).json({message:'Reserve cancel successfully'})
    } catch (error) {
        next(error)
    }
}

// 示例：后端逻辑
export const openTable = async (req,res,next) => {
    const { tableId } = req.params;
    const { customername, phonenumber, pax } = req.body;
  
    try {
      const table = await Table.findById(tableId);
      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }
  
      // 清除 reserve 状态
      table.reserve = {
        status: false,
        customername: null,
        phonenumber: null,
        pax: null,
        timestamp: null,
      };
  
      // 设置 open 状态
      table.open = {
        status: true,
        customername,
        phonenumber,
        pax,
        timestamp: new Date(),
      };
  
      await table.save();
      res.status(200).json(table);
    } catch (error) {
      next(error)
    }
  };

export const toggleOpenStatus = async (req, res, next) => {
    try {
      const { tableId } = req.params;
      const { open } = req.body;
  
      const table = await Table.findById(tableId);
      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }
  
      // 更新 open.status
      table.open.status = open.status;
      await table.save();
  
      res.status(200).json(table);
    } catch (error) {
      next(error);
    }
  };

  export const getDisabledTables = async (req,res,next) => {
    try {
        // 查找所有被禁用的表格
        const disabledTables = await Table.find({ disabled: true }, { _id: 1 });
        
        // 返回被禁用的表格 ID 列表
        res.status(200).json(disabledTables.map(table => table._id));
    } catch (error) {
        next(error)
    }
  }

  // 每分钟检查一次过期的预订
cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const tables = await Table.find({ 'reserve.status': true });
  
      for (const table of tables) {
        if (new Date(table.reserve.timestamp) < now) {
          // 取消过期的预订
          table.reserve = {
            status: false,
            customername: null,
            phonenumber: null,
            pax: null,
            timestamp: null,
          };
          await table.save();
          console.log(`Cancelled reservation for table ${table.tablename}`);
        }
      }
    } catch (error) {
      console.error('Error cancelling expired reservations:', error);
    }
  });