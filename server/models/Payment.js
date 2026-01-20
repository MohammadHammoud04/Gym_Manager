const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId, //like a fk
        ref: "Member",
        required: true
    },
    membershipType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MembershipType",
        required: true
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

paymentSchema.pre("save", function(next){
    if(!this.invoiceNumber){
        this.invoiceNumber = `INv-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    }
    next();
});

module.exports = mongoose.model("Payment", paymentSchema);
