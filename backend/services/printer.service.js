import escpos from 'escpos';
import escposNetwork from 'escpos-network';
import Printer from '../models/printer.model.js';

// Configure encoding support
escpos.Network = escposNetwork;
escpos.Encoder = require('iconv-lite').getEncoder('gbk');

export const printReceipt = async (printerName, orderData) => {
  const printer = await Printer.findOne({ printername: printerName });
  if (!printer) throw new Error('Printer not found');

  const device = new escpos.Network(printer.printerip);
  const printerClient = new escpos.Printer(device, {
    encoding: 'GB18030',
    width: 42
  });

  return new Promise((resolve, reject) => {
    device.open((error) => {
      if (error) return reject(error);
      
      try {
        // Print receipt header
        printerClient
          .font('a')
          .align('ct')
          .size(1, 1)
          .text('=== RECEIPT ===')
          .size(0, 0)
          .align('lt')
          .text(`Order: ${orderData.orderNumber}`)
          .text(`Table: ${orderData.table || 'N/A'}`)
          .text(`Date: ${new Date(orderData.date).toLocaleString()}`)
          .text('-----------------------------');
        
        // Print items in single line format
        orderData.items.forEach(item => {
          const namePart = `${item.name}`.substring(0, 20); // Limit name length
          const quantityPart = `x${item.quantity}`;
          const pricePart = `RM ${item.price.toFixed(2)}`;
          
          printerClient.text(
            namePart.padEnd(20) + 
            quantityPart.padStart(8) + 
            pricePart.padStart(14)
          );
        });
        
        // Print totals
        printerClient
          .text('-----------------------------')
          .text(`Subtotal:`.padEnd(28) + `RM ${orderData.subtotal.toFixed(2)}`)
          .text(`Tax:`.padEnd(28) + `RM ${orderData.tax.toFixed(2)}`)
          .text(`Total:`.padEnd(28) + `RM ${orderData.total.toFixed(2)}`)
          .align('ct')
          .text('Thank you!')
          .cut()
          .close(resolve);
      } catch (err) {
        reject(err);
      }
    });
  });
};

export const printKitchenOrder = async (printerName, orderData) => {
  const printer = await Printer.findOne({ printername: printerName });
  if (!printer) throw new Error('Printer not found');

  const device = new escpos.Network(printer.printerip);
  const printerClient = new escpos.Printer(device, {
    encoding: 'GB18030',
    width: 42
  });

  return new Promise((resolve, reject) => {
    device.open((error) => {
      if (error) return reject(error);
      
      try {
        // Print kitchen order header
        printerClient
          .align('ct')
          .size(1, 1)
          .text('=== KITCHEN ORDER ===')
          .size(0, 0)
          .align('lt')
          .text(`Order: ${orderData.orderNumber}`)
          .text(`Table: ${orderData.table || 'N/A'}`)
          .text(`Time: ${new Date().toLocaleTimeString()}`)
          .text('-----------------------------');
        
        // Print items
        orderData.items.forEach(item => {
          printerClient.text(`${item.name} x${item.quantity}`);
          if (item.notes) {
            printerClient.text(`Note: ${item.notes}`);
          }
        });
        
        printerClient
          .cut()
          .close(resolve);
      } catch (err) {
        reject(err);
      }
    });
  });
};