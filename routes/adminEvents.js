const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const router = express.Router();
const mongoose = require("mongoose");
const Event = require("../models/Events");


router.post("/", async (req, res) => {
  try {
    const {
      title,
      startDate,
      endDate,
      location,
      organizer,
      contact,
      description,
      rules,
      prizes,
      sportsCategory,
      applyLastDate,
      coordinator_name,
      coordinator_no,
      imageUrl,
      _id, // Created by user ID
    } = req.body;

    // Create new event with all fields
    const event = await Event.create({
      title,
      startDate,
      endDate,
      location,
      organizer,
      contact,
      description,
      rules,
      prizes,
      sportsCategory,
      applyLastDate,
      coordinator_name,
      coordinator_no,
      imageUrl: imageUrl || undefined, // Use default if not provided
      createdBy: _id,
    });

    // Initialize notification counters
    let successCount = 0;
    let failureCount = 0;
    
    // Find users with matching sports interests to send notifications
    try {
      console.log(`Finding users with interests matching: ${sportsCategory}`);

      // Parse the sports category to handle multiple categories
      let categories = [];
      if (typeof sportsCategory === 'string') {
        // Split by comma if it's a comma-separated string
        if (sportsCategory.includes(',')) {
          categories = sportsCategory.split(',').map(cat => cat.trim().toLowerCase());
        } else {
          categories = [sportsCategory.trim().toLowerCase()];
        }
      } else if (Array.isArray(sportsCategory)) {
        categories = sportsCategory.map(cat => cat.toLowerCase());
      } else {
        categories = [String(sportsCategory).toLowerCase()];
      }

      console.log(`Parsed categories: ${JSON.stringify(categories)}`);

      // Create an array of queries to match users with any of the categories
      const queries = [];
      
      // Match against sports_interest field (string format)
      categories.forEach(category => {
        queries.push({ sports_interest: { $regex: category, $options: 'i' } });
      });
      
      // Also try to match against preferredSports field (some users might have this instead)
      categories.forEach(category => {
        queries.push({ preferredSports: { $regex: category, $options: 'i' } });
      });
      
      // Find users matching any of the queries
      const matchingUsers = await User.find({
        $or: queries,
        user_type: "student", // Only send to students, not admins
        email: { $exists: true, $ne: "" } // Ensure they have an email
      });

      console.log(`Found ${matchingUsers.length} users with matching interests`);

      // Send email notifications to matching users in batches to avoid overwhelming the email server
      const batchSize = 10; // Process 10 emails at a time
      const totalUsers = matchingUsers.length;
      
      console.log(`Preparing to send ${totalUsers} email notifications in batches of ${batchSize}`);
      
      // Process users in batches
      for (let i = 0; i < totalUsers; i += batchSize) {
        const batch = matchingUsers.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1} with ${batch.length} users`);
        
        const notificationPromises = batch.map(user => {
          return sendEventNotification(
            user.email,
            user.fullname,
            event
          ).catch(error => {
            console.error(`Failed to send notification to ${user.email}: ${error.message}`);
            return { status: 'rejected', reason: error };
          });
        });

        // Wait for the current batch to complete
        const results = await Promise.allSettled(notificationPromises);
        
        // Count successes and failures
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value === true) {
            successCount++;
          } else {
            failureCount++;
          }
        });
        
        console.log(`Batch ${Math.floor(i/batchSize) + 1} completed. Progress: ${i + batch.length}/${totalUsers}`);
        
        // Add a small delay between batches to avoid rate limiting
        if (i + batchSize < totalUsers) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Email notification summary: ${successCount} sent successfully, ${failureCount} failed`);
    } catch (notificationError) {
      console.error("Error sending event notifications:", notificationError);
      // Continue with the response even if notifications fail
    }

    // Include notification stats in the response
    let notificationMessage = "";
    if (successCount > 0 || failureCount > 0) {
      notificationMessage = `Sent notifications to ${successCount} users` + 
        (failureCount > 0 ? ` (${failureCount} failed)` : "");
    }

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
      notifications: {
        sent: successCount,
        failed: failureCount,
        message: notificationMessage
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

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

// Get single event
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

router.delete("/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (!deletedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }
    return res.json({
      success: true,
      message: "Event deleted successfully",
      event: deletedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Endpoint for ML recommendation system to get event titles and categories
router.get("/titles-categories", async (req, res) => {
  try {
    const events = await Event.find({}, 'title sportsCategory _id');

    res.json({
      success: true,
      events: events
    });
  } catch (error) {
    console.error("Error fetching events for recommendation:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching events for recommendation",
      error: error.message
    });
  }
});

module.exports = router;
