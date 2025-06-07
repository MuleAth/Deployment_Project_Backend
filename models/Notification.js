const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error"],
      default: "info",
    },
    targetUserTypes: {
      type: [String],
      enum: ["all", "student", "admin", "faculty"],
      default: ["all"],
    },
    isRead: {
      type: Map,
      of: Boolean,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ "isRead.$*": 1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;