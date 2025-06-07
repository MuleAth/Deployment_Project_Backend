const express = require("express");
const router = express.Router();
const User = require("../models/Users");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// Update user profile
router.put("/update", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      mobile_number,
      collegeid,
      department,
      year,
      age,
      description,
      address,
      sports_interest,
      achievements,
      profile_picture
    } = req.body;

    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create an object with fields to update
    const updateFields = {};
    
    // Only update fields that are provided and allowed to be updated
    if (mobile_number) updateFields.mobile_number = mobile_number;
    if (collegeid) updateFields.collegeid = collegeid;
    if (department) updateFields.department = department;
    if (year) updateFields.year = year;
    if (age) updateFields.age = age;
    if (description) updateFields.description = description;
    if (address) updateFields.address = address;
    if (sports_interest) updateFields.sports_interest = sports_interest;
    if (achievements) updateFields.achievements = achievements;
    if (profile_picture) updateFields.profile_picture = profile_picture;
    
    // Update the user with the provided fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
});

module.exports = router;