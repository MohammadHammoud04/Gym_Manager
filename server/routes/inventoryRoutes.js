const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");

//get stock
router.get("/", async (req, res) => {
    try {
        const items = await Inventory.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;