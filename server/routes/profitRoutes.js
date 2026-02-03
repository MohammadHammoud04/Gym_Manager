const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Expense = require("../models/Expense");
const Sale = require("../models/Sale");

// Profit per PT Coach
router.get("/by-coach", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const result = await Payment.aggregate([
      { 
        $match: { 
          category: "PT", 
          coachName: { $exists: true, $ne: "" },
          date: { $gte: startOfMonth } 
        } 
      },

      {
        $group: {
          _id: "$coachName",
          total: { $sum: "$amount" },
          sessionsSold: { $sum: "$ptSessions" }
        }
      },

      { $sort: { total: -1 } }
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


//total profit
router.get("/total", async (req, res) => {
    try {
        // 1. Calculate Membership Revenue (from Payments)
        const paymentResult = await Payment.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const membershipRevenue = paymentResult[0]?.total || 0;

        // 2. Calculate Shop Revenue (from Sales)
        const saleResult = await Sale.aggregate([
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        const shopRevenue = saleResult[0]?.total || 0;

        // 3. Calculate Total Expenses
        const expenseResult = await Expense.aggregate([
            { $group: { _id: null, total: { $sum: "$price" } } }
        ]);
        const totalExpenses = expenseResult[0]?.total || 0;

        // 4. Final Calculations
        const totalRevenue = membershipRevenue + shopRevenue;
        const netProfit = totalRevenue - totalExpenses;

        res.json({ 
            revenue: totalRevenue,       // Memberships + Shop
            membershipRevenue,            // Breakdown for dashboard
            shopRevenue,                  // Breakdown for dashboard
            expenses: totalExpenses,      // Total costs
            netProfit: netProfit          // Final money left
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Profit per class
router.get("/by-class", async (req, res) => {
  try {
    const result = await Payment.aggregate([
      {
        $lookup: {
          from: "membershiptypes", 
          localField: "membershipType",
          foreignField: "_id",
          as: "membership"
        }
      },
      { $unwind: { path: "$membership", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          // If membership category exists, use it. Otherwise, use the Payment category (e.g., "PT")
          _id: { $ifNull: ["$membership.category", "$category"] },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { total: -1 } }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
    
  router.get("/range", async (req, res) => {
      const { start, end } = req.query;
    
      try {
        const match = {};
    
        if (start && end) {
          const startDate = new Date(start);
          startDate.setHours(0, 0, 0, 0);
    
          const endDate = new Date(end);
          endDate.setHours(23, 59, 59, 999);
    
          match.date = {
            $gte: startDate,
            $lte: endDate
          };
        }
    
        // 1. Get Membership Revenue for this range
        const paymentResult = await Payment.aggregate([
          { $match: match },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
    
        // 2. Get Shop Sales Revenue for this range
        const saleResult = await Sale.aggregate([
          { $match: match },
          { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
    
        // 3. Get Expenses for this range
        const expenseResult = await Expense.aggregate([
          { $match: match },
          { $group: { _id: null, total: { $sum: "$price" } } }
        ]);
    
        const totalRevenue = (paymentResult[0]?.total || 0) + (saleResult[0]?.total || 0);
        const totalExpenses = expenseResult[0]?.total || 0;
    
        // The result is the Net Profit for the specific day/month
        res.json({ 
          total: totalRevenue - totalExpenses,
          revenue: totalRevenue,
          expenses: totalExpenses 
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
module.exports = router;