const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  nameNormalized: { type: String},
  memberships: [{
    membershipType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipType",
      required: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  }]
},{timestamps: true});

//to make it so that 2 people cant have the same name and phone number
memberSchema.index({ name: 1, phone: 1 }, { unique: true });

memberSchema.pre("save", function (next) {
  if (this.name) {
    // Pretty display name
    this.name = this.name
      .trim()
      .split(" ")
      .map(
        word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(" ");

    // Normalized version for uniqueness
    this.nameNormalized = this.name.toLowerCase();
  }
  next();
});


module.exports = mongoose.model("Member", memberSchema);
