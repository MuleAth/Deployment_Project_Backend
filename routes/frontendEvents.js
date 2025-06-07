const express = require("express");
const router = express.Router();
const Event = require("../models/Events");
const User = require("../models/Users");

// Get all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "fullname email")
      .populate("participants", "fullname email mobile_number");

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "fullname email")
      .populate("participants", "fullname email mobile_number");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/register-event/:eventId/:userId", async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    const user = await User.findById(req.params.userId);

    const { termsAccepted, rulesAccepted } = req.body;

    if (!termsAccepted || !rulesAccepted) {
      return res
        .status(400)
        .json({ success: false, message: "Accept the terms." });
    }

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (Array.isArray(event.participants) && event.participants.includes(user._id)) {
      return res
        .status(400)
        .json({ message: "User already registered for this event" });
    }    

    event.participants.push(user._id);
    user.registeredEvents.push(event._id);

    await event.save();
    await user.save();

    res.status(200).json({ message: "User registered for event successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
