const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },

  addedToInventory: {
    type: Boolean,
    default: false
  },
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);
