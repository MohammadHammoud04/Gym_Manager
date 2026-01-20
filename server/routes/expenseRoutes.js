const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const Inventory = require("../models/Inventory");

// Add a new expense
router.get("/", async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/add", async (req, res) => {
    const { name, amount, price, addToInventory, salePrice } = req.body;
    try {
        // 1. Save the Expense as usual for profit tracking
        const newExpense = new Expense({ name, amount, price });
        await newExpense.save();

        // 2. If toggled, update or create Inventory item
        if (addToInventory) {
            const costPerUnit = price / amount;
            await Inventory.findOneAndUpdate(
                { name: name.toLowerCase() },
                { 
                    $inc: { currentStock: amount },
                    $set: { costPrice: costPerUnit, salePrice: salePrice || (costPerUnit * 1.5) } 
                },
                { upsert: true, new: true }
            );
        }
        res.status(201).json(newExpense);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;