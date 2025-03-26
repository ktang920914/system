import Order from "../models/order.model.js";
import {Product} from "../models/product.model.js";

export const createOrder = async (req, res, next) => {
    try {
        const { table, orderitems, ordercomboitem = [] } = req.body;

        // Generate order number
        const now = new Date();
        const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const ordernumber = `ORD-${datePart}-${randomPart}`;
        
        // Validate and convert numeric fields with product tax rates
        const validatedOrderItems = await Promise.all((orderitems || []).map(async (item) => {
            const product = await Product.findOne({ productname: item.orderproductname });
            const taxRate = product?.producttax || 0;
            
            const quantity = Number(item.orderproductquantity) || 0;
            const price = Number(item.orderproductprice) || 0;
            
            if (isNaN(quantity)) throw new Error(`Invalid quantity for item: ${item.orderproductname}`);
            if (isNaN(price)) throw new Error(`Invalid price for item: ${item.orderproductname}`);
            
            return {
                ...item,
                orderproductquantity: quantity,
                orderproductprice: price,
                orderproducttax: taxRate // Use product's tax rate
            };
        }));

        const validatedComboItems = await Promise.all((ordercomboitem || []).map(async (combo) => {
            const product = await Product.findOne({ productname: combo.comboproductitem });
            const taxRate = product?.producttax || 0;
            
            const quantity = Number(combo.comboproductquantity) || 0;
            const price = Number(combo.comboproductprice) || 0;
            
            if (isNaN(quantity)) throw new Error(`Invalid quantity for combo: ${combo.comboproductitem}`);
            if (isNaN(price)) throw new Error(`Invalid price for combo: ${combo.comboproductitem}`);
            
            return {
                ...combo,
                comboproductquantity: quantity,
                comboproductprice: price,
                comboproducttax: taxRate, // Use product's tax rate
                combochooseitems: (combo.combochooseitems || []).map(chooseItem => ({
                    ...chooseItem,
                    combochooseitemquantity: Number(chooseItem.combochooseitemquantity) || 0
                }))
            };
        }));

        // Calculate totals
        let subtotal = 0;
        let taxtotal = 0;

        validatedOrderItems.forEach(item => {
            const itemTotal = item.orderproductprice * item.orderproductquantity;
            subtotal += itemTotal;
            
            const itemTax = itemTotal * (item.orderproducttax / 100);
            taxtotal += itemTax;
        });

        validatedComboItems.forEach(combo => {
            const comboTotal = combo.comboproductprice * combo.comboproductquantity;
            subtotal += comboTotal;
            
            const comboTax = comboTotal * (combo.comboproducttax / 100);
            taxtotal += comboTax;
        });

        const ordertotal = subtotal + taxtotal;

        // Create new order
        const newOrder = new Order({
            table,
            ordernumber,
            orderitems: validatedOrderItems,
            ordercomboitem: validatedComboItems,
            subtotal,
            taxtotal,
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
        console.error("Order creation error:", error);
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
        
        // Validate and convert numeric fields with product tax rates
        const validatedOrderItems = await Promise.all(orderitems.map(async (item) => {
            const product = await Product.findOne({ productname: item.orderproductname });
            const taxRate = product?.producttax || 0;
            
            return {
                ...item,
                orderproductquantity: Number(item.orderproductquantity),
                orderproductprice: Number(item.orderproductprice),
                orderproducttax: taxRate // Use product's tax rate
            };
        }));

        const validatedComboItems = await Promise.all(ordercomboitem.map(async (combo) => {
            const product = await Product.findOne({ productname: combo.comboproductitem });
            const taxRate = product?.producttax || 0;
            
            return {
                ...combo,
                comboproductquantity: Number(combo.comboproductquantity),
                comboproductprice: Number(combo.comboproductprice),
                comboproducttax: taxRate, // Use product's tax rate
                combochooseitems: combo.combochooseitems.map(chooseItem => ({
                    ...chooseItem,
                    combochooseitemquantity: Number(chooseItem.combochooseitemquantity)
                }))
            };
        }));
        
        // Calculate new subtotal and tax
        let subtotal = 0;
        let taxtotal = 0;

        validatedOrderItems.forEach(item => {
            const itemTotal = item.orderproductprice * item.orderproductquantity;
            subtotal += itemTotal;
            taxtotal += itemTotal * (item.orderproducttax / 100);
        });

        validatedComboItems.forEach(combo => {
            const comboTotal = combo.comboproductprice * combo.comboproductquantity;
            subtotal += comboTotal;
            taxtotal += comboTotal * (combo.comboproducttax / 100);
        });

        const ordertotal = subtotal + taxtotal;

        const updatedOrder = await Order.findOneAndUpdate(
            { ordernumber },
            {
                orderitems: validatedOrderItems,
                ordercomboitem: validatedComboItems,
                subtotal,
                taxtotal,
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