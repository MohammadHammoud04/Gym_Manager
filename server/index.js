const path = require("path"); 
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const fs = require('fs');

const isInsideAsar = __dirname.includes('app.asar');

const isProduction = __dirname.includes('resources');

const envPath = isProduction 
  ? path.join(__dirname, '.env')         // Production: look in resources/server/.env
  : path.join(__dirname, '..', '.env');  // Development: look in root/.env


console.log("CLOUD_MONGO_URI:", process.env.CLOUD_MONGO_URI);
console.log("LOCAL_MONGO_URI:", process.env.LOCAL_MONGO_URI);

console.log(`[Server] Is Production: ${isProduction}`);
console.log(`[Server] Environment loaded from: ${envPath}`);

console.log(`[Server] Environment loaded from: ${envPath}`);

const loginRoutes = require("./routes/login.js");
const memberRoutes = require("./routes/memberRoutes.js");
const membershipTypeRoutes = require("./routes/membershipTypeRoutes.js");
const profitRoutes = require("./routes/profitRoutes.js");
const paymentRoutes = require("./routes/paymentRoutes.js");
const expenseRoutes = require("./routes/expenseRoutes.js");
const saleRoutes = require("./routes/saleRoutes.js");
const inventoryRoutes = require("./routes/inventoryRoutes.js");
const syncRoutes = require("./routes/sync.js");

const User = require("./models/User.js");

const app = express();

app.use(cors());
app.use(express.json());

// Status check
app.get("/api/db-status", (req, res) => {
  const isLocal = mongoose.connection.host === "127.0.0.1" || mongoose.connection.host === "localhost";
  res.json({ mode: isLocal ? "Local (Fast)" : "Cloud (Online Fallback)" });
});

// Routes
app.use("/sales", saleRoutes);
app.use("/expenses", expenseRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/login", loginRoutes);
app.use("/members", memberRoutes);
app.use("/membership-types", membershipTypeRoutes);
app.use("/profit", profitRoutes);
app.use("/payments", paymentRoutes);
app.use("/sync", syncRoutes);


const localURI = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017/gym-manager";
const cloudURI = process.env.CLOUD_MONGO_URI || process.env.MONGO_URI;

const connectDB = async () => {
  try {
    console.log("Attempting to connect to Local MongoDB...");
    // 3 second timeout is good for a quick fallback check
    await mongoose.connect(localURI, { serverSelectionTimeoutMS: 3000 }); 
    console.log("Connected to Local MongoDB (Offline Mode)");
    createDefaultUsers();
  } catch (localErr) {
    console.log("Local MongoDB not found. Switching to Cloud Atlas...");
    try {
      if (!cloudURI) throw new Error("Cloud URI is missing in .env");
      await mongoose.connect(cloudURI);
      console.log("Connected to Cloud MongoDB (Online Mode)");
      createDefaultUsers();
    } catch (cloudErr) {
      console.error("CRITICAL ERROR: Could not connect to any database.", cloudErr);
      // In production, we don't want the app to just vanish, 
      // but the server cannot function without a DB.
      process.exit(1);
    }
  }
};

connectDB();

async function createDefaultUsers() {
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
        console.log(`Created default user: ${u.name}`);
      }
    } catch (err) {
      console.error(`Error creating default user ${u.name}:`, err);
    }
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));