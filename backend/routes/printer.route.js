import express from 'express';
import { createPrinter, getPrinters, deletePrinter, updatePrinter } from '../controllers/printer.controller.js';

const router = express.Router();

router.post('/create-printer', createPrinter);
router.get('/get-printers', getPrinters);
router.delete('/delete-printer/:printerId', deletePrinter);
router.put('/update-printer/:printerId', updatePrinter);

export default router;