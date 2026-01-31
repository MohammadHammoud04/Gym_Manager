const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true
  },
  membershipType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MembershipType",
    required: true
  },
  originalAmount: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  invoiceNumber: {
    type: String,
    unique: true
  }
}, { timestamps: true });

paymentSchema.pre("save", function () {
  if (!this.invoiceNumber) {
    this.invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
});

module.exports = mongoose.model("Payment", paymentSchema);
