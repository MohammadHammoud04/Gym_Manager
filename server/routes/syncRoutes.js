const express = require("express");
const router = express.Router();
const Member = require("../models/Member");
const Payment = require("../models/Payment");
const Sale = require("../models/Sale");
const Expense = require("../models/Expense");
const Inventory = require("../models/Inventory");
const MembershipType = require("../models/MembershipType");
const PTSession = require("../models/PTSession");

//export data
router.get("/export", async (req, res) => {
    try {
        const data = {
            members: await Member.find({}),
            payments: await Payment.find({}),
            sales: await Sale.find({}),
            expenses: await Expense.find({}),
            inventory: await Inventory.find({}),
            membershipTypes: await MembershipType.find({}),
            ptSessions: await PTSession.find({})
        };
        res.json(data);
    } catch (err) {
        console.error("Export Error:", err);
        res.status(500).json({ error: "Export failed" });
    }
});

// import data
router.post("/import", async (req, res) => {
    try {
        const { members, payments, sales, expenses, inventory, membershipTypes, ptSessions } = req.body;

        await Promise.all([
            Member.deleteMany({}),
            Payment.deleteMany({}),
            Sale.deleteMany({}),
            Expense.deleteMany({}),
            Inventory.deleteMany({}),
            MembershipType.deleteMany({}),
            PTSession.deleteMany({})
        ]);

        if (members?.length) await Member.insertMany(members);
        if (payments?.length) await Payment.insertMany(payments);
        if (sales?.length) await Sale.insertMany(sales);
        if (expenses?.length) await Expense.insertMany(expenses);
        if (inventory?.length) await Inventory.insertMany(inventory);
        if (membershipTypes?.length) await MembershipType.insertMany(membershipTypes);
        if (ptSessions?.length) await PTSession.insertMany(ptSessions);

        res.json({ message: "Database updated successfully! All records mirrored." });
    } catch (err) {
        console.error("Import Error:", err);
        res.status(500).json({ error: "Import failed: " + err.message });
    }
});

module.exports = router;