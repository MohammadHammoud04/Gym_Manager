const mongoose = require("mongoose");

const ptSessionSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true
  },
  coachName: {
    type: String,
    required: true,
    trim: true
  },
  sessionsLeft: {
    type: Number,
    default: 0
  },
  pricePerSession: {
    type: Number,
    required: true
  },
  type: {
    type: String, 
    enum: ["Member", "Daily Access"],
    default: "Member"
  }
}, { timestamps: true });

// Ensure a member can't have two separate records for the same coach
ptSessionSchema.index({ member: 1, coachName: 1 }, { unique: true });

module.exports = mongoose.model("PTSession", ptSessionSchema);