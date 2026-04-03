// backend/middleware/authMiddleware.js

// Simple auth middleware
module.exports = function (req, res, next) {
  // For now, allow all requests
  // You can replace this with real authentication logic later
  console.log("Auth middleware triggered");
  next();
};