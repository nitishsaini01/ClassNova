const express = require("express");
const cors = require("cors");
const path = require("path");

const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes");

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve uploaded profile pics
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api", studentRoutes);
app.use("/api/courses", courseRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// Default route -> open dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dashboard.html"));
});

// Start server
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});