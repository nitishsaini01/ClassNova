const express = require("express");
const cors = require("cors");
const path = require("path");

const studentRoutes = require("./routes/studentRoutes");

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Prefix all student routes with /api
app.use("/api", studentRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// Fallback route to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});