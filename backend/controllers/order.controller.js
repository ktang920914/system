import Order from "../models/order.model.js";

export const createOrder = async (req, res, next) => {
    try {
        const { table, orderitems, ordercomboitem = [] } = req.body; // Default to empty array
        
        // Debug logging
        console.log("Incoming order data:", {
            table,
            orderitems,
            ordercomboitem
        });

        // Generate order number
        const now = new Date();
        const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const ordernumber = `ORD-${datePart}-${randomPart}`;
        
        // Validate and convert numeric fields with stricter validation
        const validatedOrderItems = (orderitems || []).map(item => {
            const quantity = Number(item.orderproductquantity) || 0;
            const price = Number(item.orderproductprice) || 0;
            const tax = Number(item.orderproducttax) || 0;
            
            if (isNaN(quantity)) throw new Error(`Invalid quantity for item: ${item.orderproductname}`);
            if (isNaN(price)) throw new Error(`Invalid price for item: ${item.orderproductname}`);
            if (isNaN(tax)) throw new Error(`Invalid tax rate for item: ${item.orderproductname}`);
            
            return {
                ...item,
                orderproductquantity: quantity,
                orderproductprice: price,
                orderproducttax: tax
            };
        });

        const validatedComboItems = (ordercomboitem || []).map(combo => {
            const quantity = Number(combo.comboproductquantity) || 0;
            const price = Number(combo.comboproductprice) || 0;
            const tax = Number(combo.comboproducttax) || 0;
            
            if (isNaN(quantity)) throw new Error(`Invalid quantity for combo: ${combo.comboproductitem}`);
            if (isNaN(price)) throw new Error(`Invalid price for combo: ${combo.comboproductitem}`);
            if (isNaN(tax)) throw new Error(`Invalid tax rate for combo: ${combo.comboproductitem}`);
            
            return {
                ...combo,
                comboproductquantity: quantity,
                comboproductprice: price,
                comboproducttax: tax,
                combochooseitems: (combo.combochooseitems || []).map(chooseItem => ({
                    ...chooseItem,
                    combochooseitemquantity: Number(chooseItem.combochooseitemquantity) || 0
                }))
            };
        });

        // Calculate totals with detailed logging
        let subtotal = 0;
        let taxtotal = 0;

        console.log("Calculating regular items:");
        validatedOrderItems.forEach(item => {
            const itemTotal = item.orderproductprice * item.orderproductquantity;
            subtotal += itemTotal;
            
            const itemTax = itemTotal * (item.orderproducttax / 100);
            if (item.orderproducttax > 0) {
                taxtotal += itemTax;
                console.log(`Item ${item.orderproductname}: Price=${item.orderproductprice}, Qty=${item.orderproductquantity}, TaxRate=${item.orderproducttax}%, Tax=${itemTax}`);
            }
        });

        console.log("Calculating combo items:");
        validatedComboItems.forEach(combo => {
            const comboTotal = combo.comboproductprice * combo.comboproductquantity;
            subtotal += comboTotal;
            
            const comboTax = comboTotal * (combo.comboproducttax / 100);
            if (combo.comboproducttax > 0) {
                taxtotal += comboTax;
                console.log(`Combo ${combo.comboproductitem}: Price=${combo.comboproductprice}, Qty=${combo.comboproductquantity}, TaxRate=${combo.comboproducttax}%, Tax=${comboTax}`);
            }
        });

        const ordertotal = subtotal + taxtotal;

        console.log("Final totals:", {
            subtotal,
            taxtotal,
            ordertotal
        });

        // Create new order
        const newOrder = new Order({
            table,
            ordernumber,
            orderitems: validatedOrderItems,
            ordercomboitem: validatedComboItems, // Make sure this matches your schema
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
        
        // Validate and convert numeric fields
        const validatedOrderItems = orderitems.map(item => ({
            ...item,
            orderproductquantity: Number(item.orderproductquantity),
            orderproductprice: Number(item.orderproductprice),
            orderproducttax: Number(item.orderproducttax || 0)
        }));

        const validatedComboItems = ordercomboitem.map(combo => ({
            ...combo,
            comboproductquantity: Number(combo.comboproductquantity),
            comboproductprice: Number(combo.comboproductprice),
            comboproducttax: Number(combo.comboproducttax || 0),
            combochooseitems: combo.combochooseitems.map(chooseItem => ({
                ...chooseItem,
                combochooseitemquantity: Number(chooseItem.combochooseitemquantity)
            }))
        }));
        
        // Calculate new subtotal and tax
        let subtotal = 0;
        let taxtotal = 0;

        // Process regular items
        validatedOrderItems.forEach(item => {
            const itemTotal = item.orderproductprice * item.orderproductquantity;
            subtotal += itemTotal;
            
            if (item.orderproducttax > 0) {
                taxtotal += itemTotal * (item.orderproducttax / 100);
            }
        });

        // Process combo items
        validatedComboItems.forEach(combo => {
            const comboTotal = combo.comboproductprice * combo.comboproductquantity;
            subtotal += comboTotal;
            
            if (combo.comboproducttax > 0) {
                taxtotal += comboTotal * (combo.comboproducttax / 100);
            }
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