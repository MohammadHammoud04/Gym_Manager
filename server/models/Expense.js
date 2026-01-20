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
        required: true // This is the cost to the gym
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);