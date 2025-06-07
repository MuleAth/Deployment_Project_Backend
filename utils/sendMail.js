require('dotenv').config();
const nodemailer = require("nodemailer");

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "sportalonn@gmail.com", // Using the provided email
      pass: "osop wyts wfzg nmdn"   // Using the provided app password
    },
  });
};

const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: '"Sportalon" <sportalonn@gmail.com>',
      to: userEmail,
      subject: "Welcome to Sportalon 🎉",
      html: `<h2>Welcome, ${userName}!</h2>
             <p>Thank you for signing up. We're excited to have you on board.</p>
             <p>Explore and enjoy our sports platform!</p>
             <br/>
             <p>Best regards,</p>
             <p><strong>The Sportalon Team</strong></p>`,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${userEmail}!`);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};

const sendEventNotification = async (userEmail, userName, eventDetails) => {
  // Validate inputs
  if (!userEmail || !userName || !eventDetails) {
    console.error("Missing required parameters for sendEventNotification");
    return false;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    console.error(`Invalid email format: ${userEmail}`);
    return false;
  }

  try {
    const transporter = createTransporter();

    // Safely format dates with error handling
    let startDate = 'Not specified';
    let endDate = 'Not specified';
    let applyLastDate = 'Not specified';
    
    try {
      if (eventDetails.startDate) {
        startDate = new Date(eventDetails.startDate).toLocaleDateString();
      }
    } catch (e) {
      console.warn(`Error formatting start date: ${e.message}`);
    }
    
    try {
      if (eventDetails.endDate) {
        endDate = new Date(eventDetails.endDate).toLocaleDateString();
      }
    } catch (e) {
      console.warn(`Error formatting end date: ${e.message}`);
    }
    
    try {
      if (eventDetails.applyLastDate) {
        applyLastDate = new Date(eventDetails.applyLastDate).toLocaleDateString();
      }
    } catch (e) {
      console.warn(`Error formatting apply last date: ${e.message}`);
    }

    // Safely get event details with fallbacks
    const title = eventDetails.title || 'New Event';
    const sportsCategory = eventDetails.sportsCategory || 'Various Sports';
    const location = eventDetails.location || 'TBA';
    const description = eventDetails.description || 'Join us for this exciting event!';
    const coordinatorName = eventDetails.coordinator_name || 'Event Coordinator';
    const coordinatorContact = eventDetails.coordinator_no || eventDetails.contact || 'Contact the organizer';
    const eventId = eventDetails._id || '';

    // Email options
    const mailOptions = {
      from: '"Sportalon Events" <sportalonn@gmail.com>',
      to: userEmail,
      subject: `New Event Alert: ${title} 🏆`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4f46e5;">Hello ${userName}!</h2>

          <p>We have a new event that matches your sports interests!</p>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #4338ca; margin-top: 0;">${title}</h3>

            <p><strong>Category:</strong> ${sportsCategory}</p>
            <p><strong>Date:</strong> ${startDate} to ${endDate}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Last Date to Apply:</strong> ${applyLastDate}</p>

            <div style="margin-top: 10px;">
              <p><strong>Description:</strong></p>
              <p>${description}</p>
            </div>
          </div>

          <p>Don't miss this opportunity! Register now to participate.</p>

          <div style="text-align: center; margin: 25px 0;">
            <a href="http://localhost:5173/events/${eventId}?register=true"
               style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Register for Event
            </a>
          </div>

          <p>If you have any questions, please contact the event coordinator:</p>
          <p><strong>Coordinator:</strong> ${coordinatorName}</p>
          <p><strong>Contact:</strong> ${coordinatorContact}</p>

          <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">

          <p style="color: #6b7280; font-size: 0.9em;">
            Best regards,<br>
            The Sportalon Team
          </p>
        </div>
      `,
    };

    // Send email with retry logic
    let retries = 3;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        await transporter.sendMail(mailOptions);
        console.log(`Event notification email sent successfully to ${userEmail}!`);
        success = true;
      } catch (sendError) {
        retries--;
        if (retries > 0) {
          console.warn(`Failed to send email to ${userEmail}, retrying... (${retries} attempts left)`);
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw sendError; // Rethrow if all retries failed
        }
      }
    }
    
    return success;
  } catch (error) {
    console.error(`Error sending event notification to ${userEmail}:`, error);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendEventNotification
};
