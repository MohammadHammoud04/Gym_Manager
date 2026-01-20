// // routes/import.js
// import express from "express";
// import XLSX from "xlsx";
// import multer from "multer";
// import Member from "../models/Member.js"; // your Member schema

// const router = express.Router();

// // setup multer for file upload
// const upload = multer({ dest: "uploads/" });

// router.post("/import", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).send("No file uploaded");

//     // Read Excel file
//     const workbook = XLSX.readFile(req.file.path);
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];

//     // Convert sheet to JSON
//     const data = XLSX.utils.sheet_to_json(sheet);

//     // Map data to your DB schema
//     const members = data.map((row) => ({
//       name: row.Name,
//       phone: row.Phone,
//       membershipType: row.MembershipType,
//       startDate: new Date(row.StartDate),
//       endDate: new Date(row.EndDate),
//       // add any other fields from your Excel
//     }));

//     // Insert into DB
//     await Member.insertMany(members);

//     res.json({ success: true, imported: members.length });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Failed to import members");
//   }
// });

// export default router;
