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
            orderproductprice: Number(item.orderproductprice),
            orderproducttax: Number(item.orderproducttax || 0) // Default to 0 if not provided
        }));

        const validatedComboItems = ordercomboitem.map(combo => ({
            ...combo,
            comboproductquantity: Number(combo.comboproductquantity),
            comboproductprice: Number(combo.comboproductprice),
            comboproducttax: Number(combo.comboproducttax || 0), // Default to 0 if not provided
            combochooseitems: combo.combochooseitems.map(chooseItem => ({
                ...chooseItem,
                combochooseitemquantity: Number(chooseItem.combochooseitemquantity)
            }))
        }));

        // 计算部分修改为：
let subtotal = 0;
let taxAmount = 0;

// 处理普通商品
validatedOrderItems.forEach(item => {
    const itemTotal = item.orderproductprice * item.orderproductquantity;
    subtotal += itemTotal;
    taxAmount += itemTotal * (item.orderproducttax / 100);
});

// 处理套餐商品（关键修正点）
validatedComboItems.forEach(combo => {
    const comboTotal = combo.comboproductprice * combo.comboproductquantity; // 确保乘以数量
    subtotal += comboTotal;
    taxAmount += comboTotal * (combo.comboproducttax / 100); // 确保应用税率
});

const ordertotal = subtotal + taxAmount;

        // Create new order
        const newOrder = new Order({
            table,
            ordernumber,
            orderitems: validatedOrderItems,
            ordercomboitem: validatedComboItems,
            subtotal,
            taxtotal: taxAmount,
            ordertotal
        });
        
        await newOrder.save();

        res.status(201).json({
            success: true,
            ordernumber: newOrder.ordernumber,
            subtotal: newOrder.subtotal,
            taxtotal: newOrder.taxtotal,
            ordertotal: newOrder.ordertotal,
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
            orderproductprice: Number(item.orderproductprice),
            orderproducttax: Number(item.orderproducttax || 0) // Default to 0 if not provided
        }));

        const validatedComboItems = ordercomboitem.map(combo => ({
            ...combo,
            comboproductquantity: Number(combo.comboproductquantity),
            comboproductprice: Number(combo.comboproductprice),
            comboproducttax: Number(combo.comboproducttax || 0), // Default to 0 if not provided
            combochooseitems: combo.combochooseitems.map(chooseItem => ({
                ...chooseItem,
                combochooseitemquantity: Number(chooseItem.combochooseitemquantity)
            }))
        }));
        
        // Calculate new subtotal and tax
        let subtotal = 0;
        let taxAmount = 0;

        // Process regular items
        validatedOrderItems.forEach(item => {
            const itemTotal = item.orderproductprice * item.orderproductquantity;
            subtotal += itemTotal;
            taxAmount += itemTotal * (item.orderproducttax / 100);
        });

        // Process combo items
        validatedComboItems.forEach(combo => {
            const comboTotal = combo.comboproductprice * combo.comboproductquantity;
            subtotal += comboTotal;
            taxAmount += comboTotal * (combo.comboproducttax / 100);
        });

        const ordertotal = subtotal + taxAmount;

        const updatedOrder = await Order.findOneAndUpdate(
            { ordernumber },
            {
                orderitems: validatedOrderItems,
                ordercomboitem: validatedComboItems,
                subtotal,
                taxtotal: taxAmount,
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
            order: updatedOrder,
            subtotal: updatedOrder.subtotal,
            taxtotal: updatedOrder.taxtotal,
            ordertotal: updatedOrder.ordertotal
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
        const { subtotal, taxAmount } = req.body;
        
        const updatedOrder = await Order.findOneAndUpdate(
            { ordernumber },
            {
                subtotal: Number(subtotal),
                taxtotal: Number(taxAmount),
                ordertotal: Number(subtotal) + Number(taxAmount)
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