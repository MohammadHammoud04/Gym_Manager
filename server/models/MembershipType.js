const mongoose = require("mongoose");

const capitalizeWords = (str) => {
  if (!str) return str;
  return str
    .trim()
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const membershipTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, set: capitalizeWords },
  category: { type: String, required: true, set: capitalizeWords }, 
  audience: { type: String, required: true, set: capitalizeWords },
  price: { type: Number, required: true },
  durationInDays: { type: Number, required: true } 
});

module.exports = mongoose.model("MembershipType", membershipTypeSchema);
