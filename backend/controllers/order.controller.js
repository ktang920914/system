import Order from "../models/order.model.js";

export const createOrder = async (req, res, next) => {
    try {
        const { table, orderitems, ordercomboitem } = req.body;
        
        // Generate order number
        const now = new Date();
        const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const ordernumber = `ORD-${datePart}-${randomPart}`;
        
        // Validate and convert numeric fields
        const validatedOrderItems = orderitems.map(item => ({
            ...item,
            orderproductquantity: Number(item.orderproductquantity),
            orderproductprice: Number(item.orderproductprice)
        }));

        const validatedComboItems = ordercomboitem.map(combo => ({
            ...combo,
            comboproductquantity: Number(combo.comboproductquantity),
            comboproductprice: Number(combo.comboproductprice),
            combochooseitems: combo.combochooseitems.map(chooseItem => ({
                ...chooseItem,
                combochooseitemquantity: Number(chooseItem.combochooseitemquantity)
            }))
        }));

        // 计算小计和总计
        const subtotal = [
            ...validatedOrderItems.map(i => i.orderproductprice * i.orderproductquantity),
            ...validatedComboItems.map(c => c.comboproductprice * c.comboproductquantity)
        ].reduce((sum, amount) => sum + amount, 0);

        const taxRate = 0.08; // 8%
        const ordertotal = subtotal * (1 + taxRate);

        // Create new order
        const newOrder = new Order({
            table,
            ordernumber,
            orderitems: validatedOrderItems,
            ordercomboitem: validatedComboItems,
            subtotal,
            ordertotal,
            servicetax: 8
        });
        
        await newOrder.save();

        res.status(201).json({
            success: true,
            ordernumber: newOrder.ordernumber,
            servicetax: newOrder.servicetax,
            order: newOrder
        });
    } catch (error) {
        next(error);
    }
};

export const getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find().populate('table');
        res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        next(error);
    }
};

export const updateOrder = async (req, res, next) => {
    try {
        const { ordernumber } = req.params;
        const { orderitems, ordercomboitem } = req.body;
        
        // Validate and convert numeric fields
        const validatedOrderItems = orderitems.map(item => ({
            ...item,
            orderproductquantity: Number(item.orderproductquantity),
            orderproductprice: Number(item.orderproductprice)
        }));

        const validatedComboItems = ordercomboitem.map(combo => ({
            ...combo,
            comboproductquantity: Number(combo.comboproductquantity),
            comboproductprice: Number(combo.comboproductprice),
            combochooseitems: combo.combochooseitems.map(chooseItem => ({
                ...chooseItem,
                combochooseitemquantity: Number(chooseItem.combochooseitemquantity)
            }))
        }));
        
        // 计算新的小计和总计
        const subtotal = [
            ...validatedOrderItems.map(i => i.orderproductprice * i.orderproductquantity),
            ...validatedComboItems.map(c => c.comboproductprice * c.comboproductquantity)
        ].reduce((sum, amount) => sum + amount, 0);

        const taxRate = 0.08; // 8%
        const ordertotal = subtotal * (1 + taxRate);

        const updatedOrder = await Order.findOneAndUpdate(
            { ordernumber },
            {
                orderitems: validatedOrderItems,
                ordercomboitem: validatedComboItems,
                subtotal,
                ordertotal
            },
            { new: true }
        );
        
        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.status(200).json({
            success: true,
            order: updatedOrder
        });
    } catch (error) {
        next(error);
    }
};

export const deleteOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const deletedOrder = await Order.findByIdAndDelete(orderId);
        
        if (!deletedOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const updateOrderTotals = async (req, res, next) => {
    try {
      const { ordernumber } = req.params;
      const { subtotal, ordertotal } = req.body;
      
      const updatedOrder = await Order.findOneAndUpdate(
        { ordernumber },
        {
          subtotal: Number(subtotal),
          ordertotal: Number(ordertotal)
        },
        { new: true }
      );
      
      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      res.status(200).json({
        success: true,
        order: updatedOrder
      });
    } catch (error) {
      next(error);
    }
  };