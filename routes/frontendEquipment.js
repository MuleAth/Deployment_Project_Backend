const express = require("express");
const router = express.Router();
const Equipment = require("../models/Equipments");
const EquipmentRequest = require("../models/EquipmentRequest");
const User = require("../models/Users");

router.get("/", async (req, res) => {
  try {
    const equipments = await Equipment.find();
    return res.status(200).json({
      success: true,
      data: equipments,
    });
  } catch (error) {
    console.error("Error fetching equipment:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching equipment.",
      error: error.message,
    });
  }
});

router.post("/request-equipment", async (req, res) => {
  try {
    const { _id, equipment_id, reason, duration } = req.body;

    // Validate user
    const user = await User.findById(_id);
    if (!user) {
      return res.status(400).json({ message: "Invalid User" });
    }

    // Validate equipment
    const equipment = await Equipment.findById(equipment_id);
    if (!equipment) {
      return res.status(400).json({ message: "Invalid Equipment" });
    }

    // Create equipment request
    const request = await EquipmentRequest.create({
      user: _id,
      equipment: equipment_id,
      reason,
      duration,
    });

    res.status(201).json({
      success: true,
      message: "Equipment request submitted successfully",
      request,
    });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}); 

router.get("/requests", async(req, res)=>{
    try {
        const requests = await EquipmentRequest.find().populate("user");
        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error("Error fetching equipment requests:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while fetching equipment requests",
            error: error.message
        });
    }
});

module.exports = router;
