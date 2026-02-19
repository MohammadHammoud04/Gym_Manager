const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    // "your_jwt_secret" should match the secret in your login.js route
    const decoded = jwt.verify(token, "your_jwt_secret"); 
    req.user = decoded; // This adds { name, role, id } to every request
    next();
  } catch (ex) {
    res.status(400).json({ error: "Invalid token." });
  }
};