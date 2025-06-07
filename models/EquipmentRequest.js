const mongoose = require("mongoose");

const EquipmentRequest = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  equipment:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Equipment",
    required: true,
  },
  reason:{
    type: String,
    required: true,
  },
  duration:{
    type: Number,
  },
  isAcceptedByAdmin:{
    type: Boolean,
  },
}, {timestamps: true});

module.exports = mongoose.model("EquipmentRequest", EquipmentRequest);