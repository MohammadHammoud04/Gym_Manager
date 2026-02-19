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
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const getSum = async (Model, dateField, startDate, sumField) => {
      const result = await Model.aggregate([
        { $match: { [dateField]: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: `$${sumField}` } } }
      ]);
      return result[0]?.total || 0;
    };

    // Use Promise.all to run these faster
    const [yMem, yShop, yExp, mMem, mShop, mExp, dMem, dShop, dExp] = await Promise.all([
      getSum(Payment, "date", startOfYear, "amount"),
      getSum(Sale, "date", startOfYear, "totalPrice"),
      getSum(Expense, "date", startOfYear, "price"),
      getSum(Payment, "date", startOfMonth, "amount"),
      getSum(Sale, "date", startOfMonth, "totalPrice"),
      getSum(Expense, "date", startOfMonth, "price"),
      getSum(Payment, "date", startOfToday, "amount"),
      getSum(Sale, "date", startOfToday, "totalPrice"),
      getSum(Expense, "date", startOfToday, "price")
    ]);

    res.json({
      yearly: {
        revenue: yMem + yShop,
        expenses: yExp,
        netProfit: (yMem + yShop) - yExp
      },
      monthly: {
        revenue: mMem + mShop,
        expenses: mExp,
        netProfit: (mMem + mShop) - mExp
      },
      daily: {
        revenue: dMem + dShop,
        expenses: dExp,
        netProfit: (dMem + dShop) - dExp
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profit per class
router.get("/by-class", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await Payment.aggregate([
      { $match: { date: { $gte: startOfMonth } } },

      {
        $lookup: {
          from: "membershiptypes", 
          localField: "membershipType",
          foreignField: "_id",
          as: "typeInfo"
        }
      },

      { $unwind: { path: "$typeInfo", preserveNullAndEmptyArrays: true } },

      {
        $group: {
          _id: { 
            $cond: {
              if: { $gt: [{ $ifNull: ["$typeInfo.category", ""] }, ""] },
              then: "$typeInfo.category",
              else: "$category" 
            }
          },
          total: { $sum: "$amount" }
        }
      },

      { $sort: { total: -1 } }
    ]);

    res.json(result);
  } catch (err) {
    console.error("By-Class Error:", err);
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
    
        const paymentResult = await Payment.aggregate([
          { $match: match },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
    
        const saleResult = await Sale.aggregate([
          { $match: match },
          { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
    
        const expenseResult = await Expense.aggregate([
          { $match: match },
          { $group: { _id: null, total: { $sum: "$price" } } }
        ]);
    
        const totalRevenue = (paymentResult[0]?.total || 0) + (saleResult[0]?.total || 0);
        const totalExpenses = expenseResult[0]?.total || 0;
    
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