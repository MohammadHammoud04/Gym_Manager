const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    pricePerUnit: { type: Number, required: true },
    totalPrice: { type: Number, required: true }, // quantity * pricePerUnit
    buyerName: { type: String, default: "" }, // New Field
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Sale", saleSchema);