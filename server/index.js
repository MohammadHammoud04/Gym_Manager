const path = require("path"); 
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/sales", require("./routes/saleRoutes.js"));
app.use("/expenses", require("./routes/expenseRoutes.js"));
app.use("/inventory", require("./routes/inventoryRoutes.js"));
app.use("/login", require("./routes/login.js"));
app.use("/members", require("./routes/memberRoutes.js"));
app.use("/membership-types", require("./routes/membershipTypeRoutes.js"));
app.use("/profit", require("./routes/profitRoutes.js"));
app.use("/payments", require("./routes/paymentRoutes.js"));


const localURI = "mongodb://127.0.0.1:27017/gym-manager";

const connectDB = async () => {
  try {
    await mongoose.connect(localURI);
    console.log("✅ Connected to Local MongoDB");
    createDefaultUsers();
  } catch (err) {
    console.error("❌ LOCAL DB ERROR: Is the MongoDB Service running?", err.message);
    // Keep server alive so you can show an error in the UI
  }
};

connectDB();

// 3. Status Check (Updated for simplicity)
app.get("/api/db-status", (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({ mode: "Local-Only", status: isConnected ? "Connected" : "Disconnected" });
});

// Default user logic stays the same
async function createDefaultUsers() {
  const User = require("./models/User.js");
  const users = [
    { name: "admin", password: "admin123", role: "admin" },
    { name: "employee", password: "emp123", role: "employee" },
  ];
  for (let u of users) {
    try {
      const existing = await User.findOne({ name: u.name });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await User.create({ name: u.name, password: hashedPassword, role: u.role });
      }
    } catch (err) {}
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Local Server running on port ${PORT}`));