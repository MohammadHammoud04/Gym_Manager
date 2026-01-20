const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    currentStock: { type: Number, default: 0 },
    costPrice: { type: Number, required: true }, // Price you paid (from Expenses)
    salePrice: { type: Number, default: 0 },     // Price customer pays (for Sales)
}, { timestamps: true });

module.exports = mongoose.model("Inventory", inventorySchema);