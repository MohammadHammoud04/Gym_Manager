const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");

// Get all sales
router.get("/", async (req, res) => {
    try {
        const sales = await Sale.find().sort({ date: -1 });
        res.json(sales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a sale
router.post("/add", async (req, res) => {
    const { itemName, quantity, pricePerUnit, totalPrice } = req.body;

    try {
        //Create the Sale record (for revenue tracking)
        const newSale = new Sale({
            itemName,
            quantity: Number(quantity),
            pricePerUnit: Number(pricePerUnit),
            totalPrice: Number(totalPrice)
        });
        await newSale.save();

        //Decrement stock from Inventory if the item exists
        const inventoryItem = await Inventory.findOneAndUpdate(
            { 
                name: itemName.toLowerCase().trim(),
                currentStock: { $gte: quantity } // Only update if there is enough stock
            },
            { $inc: { currentStock: -Number(quantity) } },
            { new: true }
        );
        
        if (!inventoryItem && itemName) {
            console.log("Note: Sale recorded but inventory stock was not adjusted (item not in inventory or insufficient stock).");
        }

        res.status(201).json({
            sale: newSale,
            inventoryUpdated: !!inventoryItem,
            remainingStock: inventoryItem ? inventoryItem.currentStock : null
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
      // Find the sale first so we know what item and quantity to return
      const sale = await Sale.findById(req.params.id);
      if (!sale) return res.status(404).json({ message: "Sale not found" });
  
      //Increment the stock back in Inventory
      await Inventory.findOneAndUpdate(
        { name: sale.itemName.toLowerCase().trim() },
        { $inc: { currentStock: sale.quantity } }
      );
  
      //Delete the sale record
      await Sale.findByIdAndDelete(req.params.id);
  
      res.json({ message: "Sale deleted and stock returned" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router;