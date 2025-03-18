import Printer from "../models/printer.model.js";
import { errorHandler } from "../utils/error.js";

export const createPrinter = async (req, res, next) => {
    try {
        const { printername, printerip, areas } = req.body;
        const existingPrinter = await Printer.findOne({ printername });

        if (existingPrinter) {
            return next(errorHandler(400, 'Printer name already exists'));
        }

        const existingPrinterIP = await Printer.findOne({ printerip })
        
        if(existingPrinterIP){
            return next(errorHandler(400, 'Printer IP already exists'))
        }

        const newPrinter = new Printer({
            printername,
            printerip,
            areas,
        });

        await newPrinter.save();
        res.status(201).json(newPrinter);
    } catch (error) {
        next(error);
    }
};

export const getPrinters = async (req, res, next) => {
    try {
        const printers = await Printer.find().sort({ updatedAt: -1 });
        res.status(200).json(printers);
    } catch (error) {
        next(error);
    }
};

export const deletePrinter = async (req, res, next) => {
    try {
        const { printerId } = req.params;
        const deletedPrinter = await Printer.findByIdAndDelete(printerId);

        if (!deletedPrinter) {
            return next(errorHandler(404, 'Printer not found'));
        }

        res.status(200).json({ message: 'Printer deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const updatePrinter = async (req, res, next) => {
    try {
        const { printerId } = req.params;
        const { areas } = req.body;

        const updatedPrinter = await Printer.findByIdAndUpdate(printerId, {
            areas,
        }, { new: true });

        if (!updatedPrinter) {
            return next(errorHandler(404, 'Printer not found'));
        }

        res.status(200).json(updatedPrinter);
    } catch (error) {
        next(error);
    }
};