const express = require("express");
const User = require("../models/Users");
const router = express.Router();
const mongoose = require("mongoose");

router.get("/getAllUsers", async (req, res) => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1; // Default page 1
    const limit = parseInt(req.query.limit) || 10; // Default 10 users per page
    const skip = (page - 1) * limit; // Calculate skip value

    // Build filter object based on query parameters
    const filter = {};
    if (req.query.user_type) {
      filter.user_type = req.query.user_type; // Filter by user_type (e.g., "student" or "admin")
    }
    if (req.query.department) {
      filter.department = req.query.department; // Filter by department (e.g., "IT", "CS")
    }
    if (req.query.year) {
      filter.year = req.query.year; // Filter by year (e.g., "FE", "SE")
    }

    // Fetch users with pagination and filtering
    const users = await User.find(filter, {
      fullname: 1,
      email: 1,
      mobile_number: 1,
      user_type: 1,
      isVerifiedByAdmin: 1,
      sports_interest: 1,
      _id: 1,
    })
      .skip(skip)
      .limit(limit);

    // Get total count of users (for pagination metadata)
    const totalUsers = await User.countDocuments(filter);

    // Even if no users are found, return a success response with an empty array.
    return res.status(200).json({
      success: true,
      users, // This will be an empty array if no users match.
      pagination: {
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        usersPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

router.get("/getUser/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId).populate({
      path: "registeredEvents",
      select: "title sportsCategory", // Select necessary event fields
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error.message);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.patch("/approveUser/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's isVerifiedByAdmin field to true
    user.isVerifiedByAdmin = true;
    await user.save();

    return res
      .status(200)
      .json({ message: "User approved successfully", user });
  } catch (error) {
    console.error("Error approving user:", error.message);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.delete("/deleteUser/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

module.exports = router;
