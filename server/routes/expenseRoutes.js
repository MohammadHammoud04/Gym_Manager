const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const Inventory = require("../models/Inventory");
const Log = require("../models/Log2");

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
    const { name, amount, price, addToInventory, salePrice, userName } = req.body;
  
    try {
      let inventoryItem = null;
  
      if (addToInventory) {
        const costPerUnit = price / amount;
  
        inventoryItem = await Inventory.findOneAndUpdate(
          { name: name.toLowerCase().trim() },
          {
            $inc: { currentStock: amount },
            $set: {
              costPrice: costPerUnit,
              salePrice: salePrice || costPerUnit * 1.5
            }
          },
          { upsert: true, new: true }
        );
      }
  
      const newExpense = new Expense({
        name,
        amount,
        price,
        addedToInventory: addToInventory,
        inventoryItem: inventoryItem?._id || null
      });
  
      await newExpense.save();

      await Log.create({
        actionType: 'ADDITION',
        module: 'EXPENSE',
        details: `Added expense: ${name} (Qty: ${amount})`,
        amount: -Number(price), 
        userName: userName
      });
  
      res.status(201).json(newExpense);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  

  router.delete("/remove/:id", async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      const { userName } = req.body;
      if (!expense)
        return res.status(404).json({ message: "Expense not found" });
  
      if (expense.addedToInventory && expense.inventoryItem) {
        await Inventory.findByIdAndUpdate(
          expense.inventoryItem,
          { $inc: { currentStock: -expense.amount } }
        );
      }
      
      await Log.create({
        actionType: 'REFUND',
        module: 'EXPENSE',
        details: `Refunded/Deleted expense: ${expense.name}`,
        amount: Number(expense.price),
        userName: userName
      });
      
      await Expense.findByIdAndDelete(req.params.id);

      res.json({ message: "Expense and inventory updated" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  

module.exports = router;