const mongoose = require("mongoose");

const membershipTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // Gym, Muai Thai, etc
  audience: { type: String, required: true }, // Adult / Kids
  price: { type: Number, required: true },
  durationInDays: { type: Number, required: true } // duration of membership
});

module.exports = mongoose.model("MembershipType", membershipTypeSchema);
