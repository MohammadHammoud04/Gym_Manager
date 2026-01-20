const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Member = require("../models/Member");

// GET recent payments (last payment per member)
router.get("/recent", async (req, res) => {
  try {
    const recentPayments = await Payment.aggregate([
      { $sort: { date: -1 } }, // newest first
      {
        $group: {
          _id: "$member",
          payment: { $first: "$$ROOT" } // take latest payment per member
        }
      },
      { $replaceRoot: { newRoot: "$payment" } },
      { $limit: 20 } // optional: limit to last 20 members
    ]);

    // Populate member and membershipType
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
