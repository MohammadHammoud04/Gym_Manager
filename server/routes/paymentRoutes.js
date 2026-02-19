const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Member = require("../models/Member");

//get recent payments
router.get("/recent", async (req, res) => {
  try {
    const recentPayments = await Payment.aggregate([
      { $sort: { date: -1 } }, 
      {
        $group: {
          _id: "$member",
          payment: { $first: "$$ROOT" } 
        }
      },
      { $replaceRoot: { newRoot: "$payment" } },
      { $limit: 20 } 
    ]);

    await Payment.populate(recentPayments, [
      { path: "member", select: "name phone" },
      { path: "membershipType", select: "name price category audience" }
    ]);

    res.json(recentPayments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
