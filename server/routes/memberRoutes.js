const express = require("express");
const router = express.Router();
const Member = require("../models/Member");
const MembershipType = require("../models/MembershipType");
const Payment = require("../models/Payment");

// create or extend member
router.post("/", async (req, res) => {
    const { name, phone, memberships } = req.body;

    try {
      // check if a member exists with the SAME name AND SAME phone
      let member = await Member.findOne({ name, phone });
  
      if (!member) {
        // no exact match means we should create new member
        member = await Member.create({ name, phone, memberships: [] });
      }
  
      const payments = [];
  
      for (let m of memberships) {
        const membershipType = await MembershipType.findById(m.membershipTypeId);
        if (!membershipType) return res.status(404).json({ error: "Membership not found" });
  
        // find existing membership in the same category
        let existing = null;
        for (let mem of member.memberships) {
          const memType = await MembershipType.findById(mem.membershipType);
          if (memType.category === membershipType.category) {
            existing = mem;
            break;
          }
        }
  
        let startDate, endDate;
  
        if (existing) {
          // extend existing membership
          startDate = new Date(existing.endDate);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + membershipType.durationInDays);
  
          existing.endDate = endDate;
  
        } else {
          // new membership in this category
          startDate = new Date();
          endDate = new Date();
          endDate.setDate(endDate.getDate() + membershipType.durationInDays);
  
          member.memberships.push({
            membershipType: membershipType._id,
            startDate,
            endDate
          });
        }
  
        // create payment for this membership addition or extension
        const payment = await Payment.create({
          member: member._id,
          membershipType: membershipType._id,
          amount: membershipType.price,
          date: new Date()
        });
  
        payments.push(payment);
      }
  
      await member.save();
  
      res.status(201).json({ member, payments });
  
    } catch (err) {
      // handle duplicate index errors if name and phone unique index is in place
      if (err.code === 11000) {
        return res.status(400).json({ error: "A member with this name and phone already exists" });
      }
      res.status(500).json({ error: err.message });
    }
  });
  
  

//renew membership
router.post("/:id/renew", async (req, res) => {
    const { membershipTypeId } = req.body;
  
    try {
      const member = await Member.findById(req.params.id);
      if (!member) return res.status(404).json({ error: "Member not found" });
  
      const newMembership = await MembershipType.findById(membershipTypeId);
      if (!newMembership) return res.status(404).json({ error: "Membership not found" });
  
      //find membership with the same category
      let existing = null;
      for (let m of member.memberships) {
        const memType = await MembershipType.findById(m.membershipType);
        if (memType.category === newMembership.category) {
          existing = m;
          break;
        }
      }
  
      let startDate, endDate;
  
      if (existing) {
        // Extend existing membership by new duration
        startDate = new Date(existing.endDate); // start immediately after current end
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + newMembership.durationInDays);
  
        existing.endDate = endDate;
  
      } else {
        // No membership in this category means we should create new entry
        startDate = new Date();
        endDate = new Date();
        endDate.setDate(endDate.getDate() + newMembership.durationInDays);
  
        member.memberships.push({
          membershipType: newMembership._id,
          startDate,
          endDate
        });
      }
  
      await member.save();
  
      //create payment for renewal
      const payment = await Payment.create({
        member: member._id,
        membershipType: newMembership._id,
        amount: newMembership.price,
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
