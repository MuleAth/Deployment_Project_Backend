const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const { sendWelcomeEmail } = require("../utils/sendMail");
const router = express.Router();

// Register User - Step 1 (Basic Details)
router.post("/register", async (req, res) => {
  try {
    const { fullname, email, mobile_number, password, user_type, prn_number } =
      req.body;

    // Validate user_type (optional)
    if (user_type && !["student", "admin"].includes(user_type.toLowerCase())) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with basic details
    const newUser = new User({
      fullname,
      email,
      mobile_number,
      password: hashedPassword,
      user_type: user_type || "student",
      prn_number: prn_number || null, 
    });

    await newUser.save();

    // Send welcome email to the new user
    await sendWelcomeEmail(newUser.email, newUser.fullname);

    const token = jwt.sign(
      { userId: newUser._id, user_type: newUser.user_type },
      process.env.JWT_SECRET,
      { expiresIn:"1d" }
    );

    res.cookie("token", token, {
      httpOnly: true, 
      sameSite: "None", 
      maxAge: 3600000, 
    });

    return res.status(201).json({
      success: true,
      user: {
        id: newUser._id,
        fullname,
        email,
        mobile_number,
        user_type: newUser.user_type,
      },
      token,
    });
  } catch (error) {
    console.error("Error during registration:", error.message);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// Complete User Profile - Step 2
router.put("/create-profile", async (req, res) => {
  try {
    const {
      userId,
      profile_picture,
      collegeid,
      department,
      year,
      age,
      description,
      address,
      sports_interest,
      achievements,
    } = req.body;

    // Find user and update details
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profile_picture,
        collegeid,
        department,
        year,
        age,
        description,
        address,
        sports_interest,
        achievements,
      },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
});


// User login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token,{
      maxAge: 3600000 
    });

    res.setHeader("Authorization", `Bearer ${token}`);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        user_type: user.user_type,
        isVerifiedByAdmin: user.isVerifiedByAdmin,
        registeredEvents: user.registeredEvents,
      },
      token,
    });
  } catch (error) {
    console.error("Error during login:", error.message); // For debugging
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

module.exports = router;
