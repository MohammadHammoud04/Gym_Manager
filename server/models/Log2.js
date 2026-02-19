const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  actionType: { 
    type: String, 
    enum: ['ADDITION', 'DELETION', 'REFUND', 'SALE', 'PAYMENT', 'UPDATE'], 
    required: true 
  },
  module: { 
    type: String, 
    enum: ['MEMBER', 'EXPENSE', 'SALE', 'MEMBERSHIP_TYPE', 'PT'], 
    required: true 
  },
  details: { type: String, required: true },
  amount: { type: Number, default: 0 },
  userName: { type: String, required: true }, 
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Log", LogSchema);