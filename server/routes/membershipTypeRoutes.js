const express = require("express");
const router = express.Router();
const MembershipType = require("../models/MembershipType");

//create
router.post("/", async(req,res)=>{
    try{
        const membership = await MembershipType.create(req.body);
        res.status(201).json(membership);
    }
    catch(err){
        res.status(400).json({error : err.message});
    }
});

//read all
router.get("/", async (req, res) => {
    const memberships = await MembershipType.find();
    res.json(memberships);
});

// read one
router.get("/:id", async (req, res) => {
    const membership = await MembershipType.findById(req.params.id);
    if (!membership) return res.status(404).json({ error: "Not found" });
    res.json(membership);
});

//update
router.put("/:id", async(req,res)=>{
    try{
        console.log("UPDATE HIT", req.params.id);
        console.log("BODY:", req.body);

        const updated = await MembershipType.findByIdAndUpdate(req.params.id, req.body,{new:true, runValidators: true});
        if(!updated){
            return res.status(404).json({error:"Not found"});
        }
        return res.json(updated);
    }
    catch(err){
        console.error("UPDATE ERROR:", err);
        return res.status(500).json({error: err.message});
    }
});

//delete
router.delete("/:id", async (req, res) => {
    try {
      const deleted = await MembershipType.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Membership not found" });
      res.json({ message: "Membership deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

module.exports = router;