import Order from "../models/order.model.js";

export const createOrder = async (req, res, next) => {
    try {
        const { table, orderitems, ordercomboitem } = req.body;
        
        // Generate order number
        const now = new Date();
        const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const ordernumber = `ORD-${datePart}-${randomPart}`;
        
        // Create new order
        const newOrder = new Order({
            table,
            ordernumber,
            orderitems,
            ordercomboitem,
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
        const { orderId } = req.params;
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            req.body,
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