const express = require("express");
const router = express.Router();
const Member = require("../models/Member");
const MembershipType = require("../models/MembershipType");
const Payment = require("../models/Payment");
const PTSession = require("../models/PTSession"); 
const Log = require("../models/Log2");

// create or extend member
router.post("/", async (req, res) => {
  try {
    let { name, phone, memberships = [], ptDetails, totalAmount = 0, paidAmount = 0 } = req.body;

    if (!name || !phone) return res.status(400).json({ error: "Name and phone are required" });

    const nameNormalized = name.trim().toLowerCase();
    const phoneTrimmed = phone.trim();

    let member = await Member.findOne({ nameNormalized, phone: phoneTrimmed }).populate("memberships.membershipType");
    
    if (!member) {
      member = new Member({
        name: name.trim(),
        phone: phoneTrimmed,
        nameNormalized,
        memberships: [],
        balance: 0
      });
    }

    let remainingCash = Number(paidAmount);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const createdPayments = [];

//process payments
    for (const m of memberships) {
      const newType = await MembershipType.findById(m.membershipTypeId);
      if (!newType) continue;

//guest logic
      const quantity = Math.max(1, Number(m.quantity || 1));
      const isGuest = newType.category?.toLowerCase() === "guest";
      const duration = isGuest ? quantity : (newType.durationInDays || 0);

//cal cost and split payments
      const costOfThis = (newType.price * quantity);
      const payForThis = Math.min(remainingCash, costOfThis);
      const debtForThis = costOfThis - payForThis;

      const existing = member.memberships.find(mem => 
        mem.membershipType && (
          mem.membershipType._id?.toString() === newType._id.toString() ||
          mem.membershipType.category === newType.category
        ) && !mem.isFrozen
      );

      if (existing) {
        const baseStart = new Date(existing.endDate) > today ? new Date(existing.endDate) : today;
        const newEnd = new Date(baseStart);
        newEnd.setDate(newEnd.getDate() + duration);
        existing.endDate = newEnd;
        existing.membershipType = newType._id;
        existing.balance = (existing.balance || 0) + debtForThis; // Specific debt
      } else {
        let endDate = new Date(today);
        endDate.setDate(endDate.getDate() + duration);
        member.memberships.push({
          membershipType: newType._id,
          startDate: today,
          endDate: endDate,
          quantity: quantity,
          balance: debtForThis 
        });
      }

//log payments for each class
      if (payForThis > 0) {
        createdPayments.push(await Payment.create({
          member: member._id,
          membershipType: newType._id,
          amount: payForThis,
          originalAmount: costOfThis,
          category: "Membership",
          date: new Date()
        }));
      }
      remainingCash -= payForThis;
    }

    // process pt
    if (ptDetails && ptDetails.coachName?.trim()) {
      const ptPrice = Number(ptDetails.price || 0) * Number(ptDetails.sessions || 0);
      const payForPT = Math.min(remainingCash, ptPrice);
      const ptDebt = ptPrice - payForPT;
    
      await PTSession.findOneAndUpdate(
        { member: member._id, coachName: ptDetails.coachName.trim() },
        { 
            $inc: { 
              sessionsLeft: Number(ptDetails.sessions),
              balance: ptDebt 
            },
            $set: { type: ptDetails.type, pricePerSession: Number(ptDetails.price || 0) }
        },
        { upsert: true }
      );
    
      if (payForPT > 0) {
        createdPayments.push(await Payment.create({
          member: member._id,
          amount: payForPT,
          originalAmount: ptPrice,
          category: "PT",
          coachName: ptDetails.coachName.trim(),
          ptSessions: Number(ptDetails.sessions),
          date: new Date()
        }));
      }
      remainingCash -= payForPT; 
    }
    
    const transactionDebt = Number(totalAmount) - Number(paidAmount);
    member.balance = (member.balance || 0) + transactionDebt; 
    
    await member.save();

    await Log.create({
      actionType: 'ADDITION',
      module: 'MEMBER',
      details: `Added/Renewed member: ${member.name}`,
      amount: Number(paidAmount),
      userName: req.body.userName
    });

    res.status(201).json({ member, payments: createdPayments });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

//update info
router.put("/:id", async (req, res) => {
  try {
    const { info, userName } = req.body;
    
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { $set: { info: info } },
      { new: true } 
    );

    if (!member) return res.status(404).json({ error: "Member not found" });

    await Log.create({
      actionType: 'UPDATE',
      module: 'MEMBER',
      details: `Updated info for ${member.name}`,
      userName: userName || "System"
    });

    res.json(member);
  } catch (err) {
    console.error("Update Info Error:", err);
    res.status(500).json({ error: err.message });
  }
});


//pay-balance route
router.patch("/:id/pay-balance", async (req, res) => {
  try {
    const { amountPaid, membershipTypeId, coachName, userName } = req.body;
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });

    const currentTotalBalance = member.balance || 0;
    const paymentAmount = Number(amountPaid || 0);
    
    member.balance = Math.max(0, currentTotalBalance - paymentAmount);

    let paymentCategory = "Other";

    if (coachName) {
      paymentCategory = "PT";
      const session = await PTSession.findOneAndUpdate(
        { member: req.params.id, coachName: coachName },
        { $inc: { balance: -paymentAmount } },
        { new: true }
      );
      
      if (session && session.balance < 0) {
        session.balance = 0;
        await session.save();
      }
    } else if (membershipTypeId) {
      const membershipEntry = member.memberships.id(membershipTypeId);
      
      if (membershipEntry) {
        const mType = await MembershipType.findById(membershipEntry.membershipType);
        
        paymentCategory = mType ? mType.category : "Membership";

        const currentMembershipBalance = membershipEntry.balance || 0;
        membershipEntry.balance = Math.max(0, currentMembershipBalance - paymentAmount)
      }
    }

    await Payment.create({
      member: member._id,
      membershipType: membershipTypeId,
      amount: paymentAmount,
      originalAmount: currentTotalBalance, 
      category: paymentCategory, 
      coachName: coachName || null, 
      date: new Date()
    });

    await member.save();

    await Log.create({
      actionType: 'PAYMENT',
      module: 'MEMBER',
      details: `${member.name} paid ${paymentAmount} towards ${paymentCategory}`,
      amount: Number(paymentAmount),
      userName: userName || "System"
    });

    res.json(member);
  } catch (err) {
    console.error("PAYMENT ROUTE ERROR:", err); // THIS WILL SHOW IN YOUR TERMINAL
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/renew", async (req, res) => {
  const { membershipTypeId, ptDetails } = req.body;

  try {
    const member = await Member.findById(req.params.id).populate("memberships.membershipType");
    if (!member) return res.status(404).json({ error: "Member not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const createdPayments = [];

    if (membershipTypeId) {
      const newType = await MembershipType.findById(membershipTypeId);
      if (newType) {
        const existing = member.memberships.find(mem =>
          mem.membershipType?.category === newType.category
        );

        if (existing) {
          const baseStart =
            new Date(existing.endDate) > today
              ? new Date(existing.endDate)
              : today;

          const newEnd = new Date(baseStart);
          newEnd.setDate(newEnd.getDate() + newType.durationInDays);

          existing.endDate = newEnd;
          existing.membershipType = newType._id;
        } else {
          const endDate = new Date(today);
          endDate.setDate(endDate.getDate() + newType.durationInDays);

          member.memberships.push({
            membershipType: newType._id,
            startDate: today,
            endDate
          });
        }

        const p = await Payment.create({
          member: member._id,
          membershipType: newType._id,
          originalAmount: newType.price,
          discount: 0,
          amount: newType.price,
          date: new Date(),
          category: "Membership"
        });

        createdPayments.push(p);
      }
    }

    if (ptDetails?.coachName) {
      const num = Number(ptDetails.sessions);
      const price = Number(ptDetails.price);

      await PTSession.findOneAndUpdate(
        { member: member._id, coachName: ptDetails.coachName.trim() },
        { $inc: { sessionsLeft: num }, $set: { pricePerSession: price } },
        { upsert: true }
      );

      const ptPay = await Payment.create({
        member: member._id,
        originalAmount: num * price,
        discount: 0,
        amount: num * price,
        date: new Date(),
        category: "PT",
        coachName: ptDetails.coachName.trim(),
        ptSessions: num
      });

      createdPayments.push(ptPay);
    }

    await member.save();
    res.json({ member, payments: createdPayments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/memberships/:membershipId/dates", async (req, res) => {
  try {
    const { startDate, endDate, userName } = req.body;
    const member = await Member.findById(req.params.id);
    
    if (!member) return res.status(404).json({ error: "Member not found" });

    const membership = member.memberships.id(req.params.membershipId);
    if (!membership) return res.status(404).json({ error: "Membership not found" });

    if (startDate) membership.startDate = new Date(startDate);
    if (endDate) membership.endDate = new Date(endDate);

    membership.isFrozen = false;
    membership.daysLeftAtFreeze = 0;

    await Log.create({
      actionType: 'UPDATE',
      module: 'MEMBER',
      details: `Changed dates for ${member.name}: ${startDate} to ${endDate}`,
      userName: userName
    });

    await member.save();
    res.json({ member });
  } catch (err) {
    console.error("Update Dates Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const memberId = req.params.id;
    const { userName } = req.body;
    const member = await Member.findById(memberId);
    
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    if (member) {
      await Log.create({
        actionType: 'DELETION',
        module: 'MEMBER',
        details: `Deleted member: ${member.name}`,
        userName: userName || "System Admin", 
      });
    }
    
    await Payment.deleteMany({ member: memberId });
    await PTSession.deleteMany({ member: memberId });

    await Member.findByIdAndDelete(memberId);

    res.json({ message: "Member and associated data deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/memberships/:membershipId/freeze", async (req, res) => {
  try {
    const { userName } = req.body;
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });

    const membership = member.memberships.id(req.params.membershipId);
    if (!membership) return res.status(404).json({ error: "Membership not found" });

    const action = membership.isFrozen ? "UNFROZEN" : "FROZEN";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!membership.isFrozen) {
      const diff = membership.endDate - today;
      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (daysLeft <= 0) {
        return res.status(400).json({ error: "Cannot freeze expired membership" });
      }
      membership.isFrozen = true;
      membership.daysLeftAtFreeze = daysLeft;
    } else {
      const newEnd = new Date(today);
      newEnd.setDate(newEnd.getDate() + membership.daysLeftAtFreeze);
      membership.endDate = newEnd;
      membership.isFrozen = false;
      membership.daysLeftAtFreeze = 0;
    }

    await Log.create({
      actionType: 'UPDATE',
      module: 'MEMBER',
      details: `${action} membership for ${member.name}`,
      userName: userName
    });

    await member.save();
    res.json({ member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/decrement-pt", async (req, res) => {
  const { coachName, userName } = req.body;
  try {
    const member = await Member.findById(req.params.id);
    const session = await PTSession.findOneAndUpdate(
      { member: req.params.id, coachName, sessionsLeft: { $gt: 0 } },
      { $inc: { sessionsLeft: -1 } },
      { new: true }
    );

    if (!session) {
      return res.status(400).json({ error: "No sessions remaining" });
    }

    await Log.create({
      actionType: 'UPDATE', 
      module: 'MEMBER',
      details: `PT Session decremented for ${member.name} (Coach: ${coachName}). Sessions left: ${session.sessionsLeft}`,
      userName: userName || "System"
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  const members = await Member.find().populate("memberships.membershipType");
  const withPT = await Promise.all(
    members.map(async m => ({
      ...m._doc,
      personalTraining: await PTSession.find({ member: m._id })
    }))
  );
  res.json(withPT);
});

router.get("/:id/payments", async (req, res) => {
  const payments = await Payment.find({ member: req.params.id })
    .populate("membershipType", "name price category")
    .sort({ date: -1 });
  res.json(payments);
});

module.exports = router;