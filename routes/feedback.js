const express = require("express");
const jwt = require("jsonwebtoken");
const Feedback = require("../models/FeedbackModel");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");

router.post("/submit", async (req, res) => {
  try {
    const token = req.body.token;
    console.log(req.cookies.token);
    
    if (!token) {
      return res.status(401).json({ message: "Unauthorized, no token" });
    }
    // Verify token and get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId; 

    console.log("Decoded token:", decoded);
    console.log("User ID from token:", userId);

    // Validate request body
    const { rating, reason, description } = req.body;
    if (!rating || !reason || !description) {
      console.log("Validation failed: Missing fields", req.body);
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create and save feedback
    const feedback = new Feedback({ user: userId, rating, reason, description });
    await feedback.save();

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully!",
      feedback,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);

    // Ensure a valid JSON response is always returned
    return res.status(500).json({
      success: false,
      message: "Error submitting feedback",
      error: error.message,
    });
  }
});

router.get("/all", async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("user", "fullname") // Populate user field, fetching only fullName
      .sort({ createdAt: -1 }); // Sort by latest feedback first

    return res.status(200).json({
      success: true,
      feedbacks,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching feedback",
      error: error.message,
    });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting feedback",
      error: error.message,
    });
  }
});


module.exports = router;
