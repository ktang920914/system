import express from 'express';
import { createPrinter, getPrinters, deletePrinter, updatePrinter } from '../controllers/printer.controller.js';

const router = express.Router();

router.post('/create-printer', createPrinter);
router.get('/get-printers', getPrinters);
router.delete('/delete-printer/:printerId', deletePrinter);
router.put('/update-printer/:printerId', updatePrinter);

// 收据打印
router.post('/print-receipt', async (req, res, next) => {
    try {
      const { printerName, content } = req.body;
      await printReceipt(printerName, content);
      res.json({ success: true });
    } catch (error) {
      next(errorHandler(500, error.message));
    }
  });
  
  // 厨房订单打印
  router.post('/print-kitchen-order', async (req, res, next) => {
    try {
      const { printerName, items } = req.body;
      await printKitchenOrder(printerName, items);
      res.json({ success: true });
    } catch (error) {
      next(errorHandler(500, error.message));
    }
  });

export default router;