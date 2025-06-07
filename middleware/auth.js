const jwt = require("jsonwebtoken");
const User = require("../models/Users");

// Middleware to check if user is authenticated
exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Please login to access this resource" 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: "Invalid or expired token" 
    });
  }
};

// Middleware to check if user is an admin
exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.user_type !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied: Admin role required" 
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error in admin verification" 
    });
  }
};