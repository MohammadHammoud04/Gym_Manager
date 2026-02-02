const express = require("express");
const router = express.Router();
const Member = require("../models/Member");
const MembershipType = require("../models/MembershipType");
const Payment = require("../models/Payment");
const PTSession = require("../models/PTSession"); // Import the new model

// create or extend member
router.post("/", async (req, res) => {
  try {
    let { name, phone, memberships, ptDetails } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    const nameTrimmed = name.trim();
    const phoneTrimmed = phone.trim();
    const nameNormalized = nameTrimmed.toLowerCase();

    // Find or create member
    let member = await Member.findOne({ nameNormalized, phone: phoneTrimmed });
    if (!member) {
      member = new Member({
        name: nameTrimmed,
        phone: phoneTrimmed,
        nameNormalized,
        memberships: []
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const createdPayments = [];

    // 1. Process memberships with CATEGORY STACKING
    for (const m of (memberships || [])) {
      const newType = await MembershipType.findById(m.membershipTypeId);
      if (!newType) continue;

      // Populate to see categories of existing memberships
      await member.populate("memberships.membershipType");

      // Find if member already has a membership in this category (e.g., "Gym")
      let existingMembership = member.memberships.find(mem => 
        mem.membershipType && mem.membershipType.category === newType.category
      );

      let startDate, endDate;

      if (existingMembership) {
        // STACKING LOGIC: Start from existing end date if it's in the future
        const currentEnd = new Date(existingMembership.endDate);
        startDate = currentEnd > today ? currentEnd : today;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + newType.durationInDays);
        
        existingMembership.endDate = endDate;
        existingMembership.membershipType = newType._id; // Update to latest type purchased
      } else {
        // NEW CATEGORY: Start from today
        startDate = new Date(today);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + newType.durationInDays);
        member.memberships.push({ membershipType: newType._id, startDate, endDate });
      }

      // Create Payment for this membership
      const discount = Number(m.discount || 0);
      const p = await Payment.create({
        member: member._id,
        membershipType: newType._id,
        originalAmount: newType.price,
        discount: discount,
        amount: newType.price - discount,
        date: new Date(),
        category: "Membership"
      });
      createdPayments.push(p);
    }

    await member.save();

    // 2. Process PT Logic
    if (ptDetails && ptDetails.coachName && ptDetails.coachName.trim() !== "") {
      const numSessions = Number(ptDetails.sessions || 0);
      const sessionPrice = Number(ptDetails.price || 0);

      if (numSessions > 0) {
        await PTSession.findOneAndUpdate(
          { member: member._id, coachName: ptDetails.coachName.trim() },
          { 
            $inc: { sessionsLeft: numSessions },
            $set: { type: ptDetails.type, pricePerSession: sessionPrice }
          },
          { upsert: true }
        );

        const ptPay = await Payment.create({
          member: member._id,
          originalAmount: numSessions * sessionPrice,
          discount: 0,
          amount: numSessions * sessionPrice,
          date: new Date(),
          coachName: ptDetails.coachName.trim(),
          ptSessions: numSessions,
          category: "PT" 
        });
        createdPayments.push(ptPay);
      }
    }

    res.status(201).json({ member, payments: createdPayments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// renew membership
router.post("/:id/renew", async (req, res) => {
  const { membershipTypeId, ptDetails } = req.body;

  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const createdPayments = [];

    // 1. Membership Renewal with CATEGORY STACKING
    if (membershipTypeId) {
      const newType = await MembershipType.findById(membershipTypeId);
      if (newType) {
        await member.populate("memberships.membershipType");

        let existing = member.memberships.find(mem => 
          mem.membershipType && mem.membershipType.category === newType.category
        );

        if (existing) {
          const currentEnd = new Date(existing.endDate);
          const startDate = currentEnd > today ? currentEnd : today;
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + newType.durationInDays);
          existing.endDate = endDate;
          existing.membershipType = newType._id;
        } else {
          const startDate = new Date(today);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + newType.durationInDays);
          member.memberships.push({ membershipType: newType._id, startDate, endDate });
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

    // 2. PT Renewal
    if (ptDetails && ptDetails.coachName) {
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

router.patch("/:id/decrement-pt", async (req, res) => {
  const { coachName } = req.body;
  try {
    const session = await PTSession.findOneAndUpdate(
      { 
        member: req.params.id, 
        coachName: coachName,
        sessionsLeft: { $gt: 0 } // ONLY if sessions are greater than 0
      },
      { $inc: { sessionsLeft: -1 } },
      { new: true }
    );

    if (!session) {
      return res.status(400).json({ error: "No sessions remaining or session not found" });
    }
    
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get all payments for a member
router.get("/:id/payments", async(req,res)=>{
    try{
        const payments = await Payment.find({member: req.params.id})
        .populate("membershipType","name price category audience")
        .sort({date: -1}); //newest first

        res.json(payments);
    }
    catch(err){
        return res.status(500).json({error: err.message});
    }
});

// GET all members
router.get("/", async (req, res) => {
  try {
    const members = await Member.find().populate("memberships.membershipType");
    const membersWithPT = await Promise.all(members.map(async (m) => {
      const pt = await PTSession.find({ member: m._id });
      return { ...m._doc, personalTraining: pt };
    }));
    res.json(membersWithPT);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET one member
router.get("/:id", async (req, res) => {
    try {
      const member = await Member.findById(req.params.id)
        .populate("memberships.membershipType");
  
      if (!member) return res.status(404).json({ error: "Member not found" });
  
      res.json(member);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

// UPDATE member
router.put("/:id", async (req, res) => {
    try {
        const updated = await Member.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ error: "Member not found" });
        }

        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE member
router.delete("/:id", async (req, res) => {
    try {
      const member = await Member.findByIdAndDelete(req.params.id);
      if (!member) return res.status(404).json({ error: "Member not found" });
  
      // Optionally, delete all payments for this member
      await Payment.deleteMany({ member: member._id });
  
      res.json({ message: "Member and payments deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router;
