const express = require("express");
const router = express.Router();
const Member = require("../models/Member");
const MembershipType = require("../models/MembershipType");
const Payment = require("../models/Payment");

// create or extend member
router.post("/", async (req, res) => {
  try {
    let { name, phone, memberships } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    const nameTrimmed = name.trim();
    const phoneTrimmed = phone.trim();
    const nameNormalized = nameTrimmed.toLowerCase();

    // 1. Find existing member
    let member = await Member.findOne({
      nameNormalized,
      phone: phoneTrimmed
    });

    // 2. Create new member if not found
    if (!member) {
      member = new Member({
        name: nameTrimmed,
        phone: phoneTrimmed,
        nameNormalized, // Explicitly provide this for the required check
        memberships: []
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Process memberships
    for (const m of memberships) {
      const membershipType = await MembershipType.findById(m.membershipTypeId);
      if (!membershipType) continue;

      let existingMembership = null;

      // Find if they already have a membership in this category
      for (const mem of member.memberships) {
        const memType = await MembershipType.findById(mem.membershipType);
        if (memType && memType.category === membershipType.category) {
          existingMembership = mem;
          break;
        }
      }

      let startDate, endDate;

      if (existingMembership) {
        const currentEnd = new Date(existingMembership.endDate);
        startDate = currentEnd > today ? currentEnd : today;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + membershipType.durationInDays);
        
        existingMembership.endDate = endDate;
        existingMembership.membershipType = membershipType._id;
      } else {
        startDate = new Date(today);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + membershipType.durationInDays);
        
        member.memberships.push({
          membershipType: membershipType._id,
          startDate,
          endDate
        });
      }
    }

    // 4. Save the member (This is where it was failing)
    await member.save();

    // 5. Create payments
    const payments = [];
    for (const m of memberships) {
      const membershipType = await MembershipType.findById(m.membershipTypeId);
      if (membershipType) {
        const payment = await Payment.create({
          member: member._id,
          membershipType: membershipType._id,
          amount: membershipType.price,
          date: new Date()
        });
        payments.push(payment);
      }
    }

    res.status(201).json({
      member,
      payments: payments.filter(Boolean)
    });

  } catch (err) {
    console.error("Member Route Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// renew membership
router.post("/:id/renew", async (req, res) => {
  const { membershipTypeId } = req.body;

  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });

    const newMembershipType = await MembershipType.findById(membershipTypeId);
    if (!newMembershipType) return res.status(404).json({ error: "Membership type not found" });

    // Find membership with the same category
    let existing = null;
    for (let m of member.memberships) {
      const memType = await MembershipType.findById(m.membershipType);
      if (memType && memType.category === newMembershipType.category) {
        existing = m;
        break;
      }
    }

    let startDate, endDate;
    const today = new Date();

    if (existing) {
      const currentEndDate = new Date(existing.endDate);

      // If the membership is still active, start from the end date.
      startDate = currentEndDate > today ? currentEndDate : today;
      
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + newMembershipType.durationInDays);

      existing.endDate = endDate;
      // Also update the membershipType ID in case they upgraded (e.g., from Bronze to Gold)
      existing.membershipType = newMembershipType._id;

    } else {
      // No membership in this category exists yet
      startDate = new Date();
      endDate = new Date();
      endDate.setDate(endDate.getDate() + newMembershipType.durationInDays);

      member.memberships.push({
        membershipType: newMembershipType._id,
        startDate,
        endDate
      });
    }

    await member.save();

    // Create payment for renewal
    const payment = await Payment.create({
      member: member._id,
      membershipType: newMembershipType._id,
      amount: newMembershipType.price,
      date: new Date()
    });

    res.json({ member, payment });

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

    const today = new Date();
    const warningDays = 7; // memberships expiring within 7 days

    const membersWithExpiryFlag = members.map((member) => {
      const memberships = member.memberships.map((m) => {
        const daysLeft = (new Date(m.endDate) - today) / (1000 * 60 * 60 * 24);
        return {
          ...m._doc,
          isExpiringSoon: daysLeft <= warningDays,
          daysLeft: Math.ceil(daysLeft)
        };
      });

      return {
        ...member._doc,
        memberships
      };
    });

    res.json(membersWithExpiryFlag);
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
