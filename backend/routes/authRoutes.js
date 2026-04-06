const express = require("express");
const router = express.Router();
const mysql = require("mysql2/promise");

// MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "mysqlnitish01", // your MySQL password
  database: "classnova"
});

// Login route (plain text)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password]
    );

    if (rows.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;