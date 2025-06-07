const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const User = require("../models/Users");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// Create a new notification (admin only)
router.post("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { title, message, type, targetUserTypes } = req.body;
    
    // Create the notification
    const notification = await Notification.create({
      title,
      message,
      type: type || "info",
      targetUserTypes: targetUserTypes || ["all"],
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
});

// Get all notifications for the current user
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const userType = req.user.user_type;
    
    // Find notifications targeted to this user's type or to all users
    const notifications = await Notification.find({
      $or: [
        { targetUserTypes: "all" },
        { targetUserTypes: userType }
      ]
    })
    .sort({ createdAt: -1 })
    .populate("createdBy", "fullname");

    // Add a read status for each notification
    const notificationsWithReadStatus = notifications.map(notification => {
      const notificationObj = notification.toObject();
      notificationObj.isRead = notification.isRead.get(userId) || false;
      return notificationObj;
    });

    res.json({
      success: true,
      count: notificationsWithReadStatus.length,
      notifications: notificationsWithReadStatus,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
});

// Mark a notification as read
router.patch("/:id/read", isAuthenticated, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id.toString();

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Update the isRead map for this user
    notification.isRead.set(userId, true);
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
});

// Get unread notification count for the current user
router.get("/unread-count", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const userType = req.user.user_type;
    
    // Find notifications targeted to this user's type or to all users
    const notifications = await Notification.find({
      $or: [
        { targetUserTypes: "all" },
        { targetUserTypes: userType }
      ]
    });

    // Count unread notifications
    const unreadCount = notifications.reduce((count, notification) => {
      const isRead = notification.isRead.get(userId) || false;
      return isRead ? count : count + 1;
    }, 0);

    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread notification count",
      error: error.message,
    });
  }
});

// Get all notifications (admin only)
router.get("/admin", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullname");

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
});

// Delete a notification (admin only)
router.delete("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
});

module.exports = router;