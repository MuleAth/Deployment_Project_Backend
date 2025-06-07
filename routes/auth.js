const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const { sendWelcomeEmail, sendOTPEmail } = require("../utils/sendMail");
const router = express.Router();

// Store OTPs temporarily (in production, use Redis or other store)
const otpStore = {};

// Generate and send OTP for email verification
router.post("/generate-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (10 minutes)
    otpStore[email] = {
      otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiration
    };

    // Send OTP to user's email
    await sendOTPEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Error during OTP generation:", error.message);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// Verify OTP and register user
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Check if OTP exists and is valid
    const otpData = otpStore[email];
    if (!otpData) {
      return res.status(400).json({ message: "OTP not found or expired, please request a new one" });
    }

    // Check if OTP is expired
    if (new Date() > otpData.expiresAt) {
      delete otpStore[email]; // Clean up expired OTP
      return res.status(400).json({ message: "OTP expired, please request a new one" });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP is verified, clear it from the store
    delete otpStore[email];

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      email
    });
  } catch (error) {
    console.error("Error during OTP verification:", error.message);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// Register User after OTP verification
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

// Verify token endpoint
router.get("/verify-token", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
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
    console.error("Token verification error:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
});

module.exports = router;
