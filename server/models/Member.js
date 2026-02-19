const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    nameNormalized: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    memberships: [
      {
        membershipType: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MembershipType",
          required: true
        },
        startDate: {
          type: Date,
          required: true
        },
        endDate: {
          type: Date,
          required: true
        },
        isFrozen: { type: Boolean, default: false },
        daysLeftAtFreeze: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
        balance: { type: Number, default: 0 }
      }
    ],
    balance: {
       type: Number, default: 0 
      },
    info: {
      bloodType: { type: String, default: "" },
      address: { type: String, default: "" },
      reference: { type: String, default: "" },
      injury: { type: String, default: "" },
      note: {type : String, default: "" }
    }
  },
  { timestamps: true }
);

memberSchema.index(
  { nameNormalized: 1, phone: 1 },
  { unique: true }
);

memberSchema.pre("validate", function () {
  if (this.name) {
    const cleaned = this.name.trim().replace(/\s+/g, " ");
    this.name = cleaned
      .split(" ")
      .map(
        word =>
          word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase()
      )
      .join(" ");
    this.nameNormalized = this.name.toLowerCase();
  }
  if (this.phone) {
    this.phone = this.phone.trim();
  }
  // No next() call needed for synchronous hooks in modern Mongoose
});
module.exports = mongoose.model("Member", memberSchema);
