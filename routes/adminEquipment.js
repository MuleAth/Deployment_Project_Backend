const Equipment = require("../models/Equipments");
const express = require("express");
const router = express.Router();
const EquipmentRequest = require("../models/EquipmentRequest");
const User = require("../models/Users");

router.post("/add", async (req, res) => {
  try {
    const { equipmentname, availableQuantity, TotalQuantity } = req.body;

    if (!equipmentname || availableQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Equipment name and available quantity are required.",
      });
    }

    const equipment = new Equipment({
      equipmentname,
      availableQuantity,
      TotalQuantity:
        TotalQuantity !== undefined ? TotalQuantity : availableQuantity,
    });

    await equipment.save();

    return res.status(201).json({
      success: true,
      message: "Equipment added successfully.",
      data: equipment,
    });
  } catch (error) {
    console.error("Error adding equipment:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while adding equipment.",
      error: error.message,
    });
  }
});

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

router.get("/getAllRequest", async (req, res) => {
  try {
    const requests = await EquipmentRequest.find()
      .populate("user", "fullname email mobile_number")
      .populate("equipment", "equipmentname");
    const length = requests.length;
    res.status(200).json({ length, success: true, requests });
  } catch (error) {
    console.error("Error fetching requests:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
});


router.put("/reject-request/:id", async (req, res) => {  // Use PUT instead of POST
  try {
    const { id } = req.params; // Get id from params

    const updatedRequest = await EquipmentRequest.findByIdAndUpdate(
      id,
      { isAcceptedByAdmin: false },
      { new: true } 
    );

    if (!updatedRequest) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.status(200).json({ success: true, message: "Request rejected successfully", request: updatedRequest });
  } catch (error) {
    console.error("Error rejecting equipment request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.put("/accept-request/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedRequest = await EquipmentRequest.findByIdAndUpdate(
      id,
      { isAcceptedByAdmin: true }, 
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.status(200).json({
      success: true,
      message: "Request accepted successfully",
      request: updatedRequest
    });
  } catch (error) {
    console.error("Error accepting equipment request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});




module.exports = router;
