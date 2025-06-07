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
      subject: "Welcome to Sportalon",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sportalon - Sports Platform</title>
            <style>
                body, html {
                    margin: 0;
                    padding: 0;
                    height: 100%;
                    width: 100%;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                body {
                    background: linear-gradient(135deg, #7b1fa2, #6a1b9a, #4a148c);
                }
                
                .email-container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #f9f9f9;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    border-radius: 12px;
                    overflow: hidden;
                }
                
                .header {
                    background: linear-gradient(120deg, #8e24aa, #6a1b9a);
                    padding: 25px 0;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDQ1KSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=');
                    opacity: 0.6;
                    z-index: 0;
                }
                
                .logo {
                    position: relative;
                    z-index: 1;
                    font-size: 42px;
                    font-weight: 800;
                    color: white;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3), 
                                 0 0 30px rgba(255, 255, 255, 0.3);
                    margin: 0;
                    padding: 0;
                }
                
                .tagline {
                    position: relative;
                    z-index: 1;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 18px;
                    font-weight: 500;
                    letter-spacing: 1px;
                    margin-top: 10px;
                }
                
                .body-content {
                    padding: 30px;
                    color: #333;
                    background-color: white;
                    position: relative;
                }
                
                .message-box {
                    border-radius: 8px;
                    background: white;
                    border-left: 4px solid #8e24aa;
                    padding: 20px;
                    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
                }
                
                .sports-icons {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    z-index: 0;
                    opacity: 0.05;
                    pointer-events: none;
                }
                
                .sports-icons::before {
                    content: '⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🏓 🏸 🏒 🏑 🥏 🏹 🥊 🚴‍♂️ 🏊‍♀️ 🏃‍♂️';
                    position: absolute;
                    font-size: 20px;
                    line-height: 40px;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-around;
                    align-items: center;
                }
                
                .footer {
                    background: #6a1b9a;
                    color: white;
                    text-align: center;
                    padding: 15px 0;
                    font-size: 14px;
                }
                
                .action-button {
                    display: inline-block;
                    background: linear-gradient(to right, #8e24aa, #9c27b0);
                    color: white;
                    text-decoration: none;
                    padding: 12px 30px;
                    border-radius: 50px;
                    font-weight: bold;
                    margin: 20px 0;
                    transition: all 0.3s;
                    box-shadow: 0 4px 10px rgba(142, 36, 170, 0.4);
                }
                
                .action-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(142, 36, 170, 0.5);
                }
                

                
                @media (max-width: 600px) {
                    .email-container {
                        width: 100%;
                        border-radius: 0;
                    }
                }
            </style>
        </head>
        <body>
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="center" valign="top" style="padding: 40px 0;">
                        <div class="email-container">
                            <div class="header">
                                <h1 class="logo">SPORTALON</h1>
                                <p class="tagline">Connect • Compete • Conquer</p>
                            </div>
                            
                            <div class="body-content">
                                <div class="sports-icons"></div>
                                
                                <div class="message-box">
                                    <h2 style="color: #6a1b9a; margin-top: 0;">Welcome to Sportalon, ${userName}!</h2>
                                    <p>Thank you for joining our sports community. Sportalon connects athletes, teams, and sports enthusiasts from around the world.</p>
                                    <p>Your account is now active and ready to use. Start exploring events, join competitions, or connect with other sports lovers!</p>
                                    
                                    <center><a href="https://sportalon-front-i7k9fziv8-atharvs-projects-c46e87c9.vercel.app" class="action-button">GET STARTED</a></center>
                                </div>
                            </div>
                            
                            <div class="footer">
                                <p>© 2025 Sportalon - The Ultimate Sports Platform</p>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
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
      subject: `New Event Alert: ${title}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sportalon - New Event Alert</title>
            <style>
                /* Reset email client styles */
                body, html {
                    margin: 0;
                    padding: 0;
                    height: 100%;
                    width: 100%;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                body {
                    background: linear-gradient(135deg, #7b1fa2, #6a1b9a, #4a148c);
                }
                
                .email-container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #f9f9f9;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    border-radius: 12px;
                    overflow: hidden;
                }
                
                .header {
                    background: linear-gradient(120deg, #8e24aa, #6a1b9a);
                    padding: 25px 0;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDQ1KSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=');
                    opacity: 0.6;
                    z-index: 0;
                }
                
                .logo {
                    position: relative;
                    z-index: 1;
                    font-size: 42px;
                    font-weight: 800;
                    color: white;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3), 
                                 0 0 30px rgba(255, 255, 255, 0.3);
                    margin: 0;
                    padding: 0;
                }
                
                .tagline {
                    position: relative;
                    z-index: 1;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 18px;
                    font-weight: 500;
                    letter-spacing: 1px;
                    margin-top: 10px;
                }
                
                .body-content {
                    padding: 30px;
                    color: #333;
                    background-color: white;
                    position: relative;
                }
                
                .message-box {
                    border-radius: 8px;
                    background: white;
                    border-left: 4px solid #8e24aa;
                    padding: 20px;
                    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
                }
                
                .event-details {
                    background-color: #f8fafc;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 15px 0;
                    border-left: 3px solid #6a1b9a;
                }
                
                .event-details h3 {
                    color: #6a1b9a;
                    margin: 0 0 10px 0;
                    font-size: 18px;
                }
                
                .event-details p {
                    margin: 5px 0;
                    color: #4a5568;
                    font-size: 14px;
                }
                
                /* Sports elements */
                .sports-icons {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    z-index: 0;
                    opacity: 0.05;
                    pointer-events: none;
                }
                
                .sports-icons::before {
                    content: '⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🏓 🏸 🏒 🏑 🥏 🏹 🥊 🚴‍♂️ 🏊‍♀️ 🏃‍♂️';
                    position: absolute;
                    font-size: 20px;
                    line-height: 40px;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-around;
                    align-items: center;
                }
                
                .footer {
                    background: #6a1b9a;
                    color: white;
                    text-align: center;
                    padding: 15px 0;
                    font-size: 14px;
                }
                
                .action-button {
                    display: inline-block;
                    background: linear-gradient(to right, #8e24aa, #9c27b0);
                    color: white;
                    text-decoration: none;
                    padding: 12px 30px;
                    border-radius: 50px;
                    font-weight: bold;
                    margin: 20px 0;
                    transition: all 0.3s;
                    box-shadow: 0 4px 10px rgba(142, 36, 170, 0.4);
                }
                
                .action-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(142, 36, 170, 0.5);
                }
                

                
                @media (max-width: 600px) {
                    .email-container {
                        width: 100%;
                        border-radius: 0;
                    }
                    
                    .logo {
                        font-size: 32px;
                    }
                    
                    .tagline {
                        font-size: 16px;
                    }
                    
                    .body-content {
                        padding: 20px;
                    }
                    
                    .event-details {
                        padding: 12px;
                    }
                    
                    .event-details h3 {
                        font-size: 16px;
                    }
                    
                    .event-details p {
                        font-size: 13px;
                    }
                }
            </style>
        </head>
        <body>
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="center" valign="top" style="padding: 40px 0;">
                        <div class="email-container">
                            <!-- Header with Sports Theme -->
                            <div class="header">
                                <h1 class="logo">SPORTALON</h1>
                                <p class="tagline">Connect • Compete • Conquer</p>
                            </div>
                            
                            <!-- Main Content Area -->
                            <div class="body-content">
                                <div class="sports-icons"></div>
                                
                                <div class="message-box">
                                    <h2 style="color: #6a1b9a; margin-top: 0;">New Event Alert</h2>
                                    <p>Hello ${userName}!</p>
                                    <p>We're excited to announce a new event that matches your interests. Don't miss this opportunity to showcase your skills and connect with fellow athletes!</p>
                                    
                                    <div class="event-details">
                                        <h3>${title}</h3>
                                        <p><strong>Category:</strong> ${sportsCategory}</p>
                                        <p><strong>Date:</strong> ${startDate}</p>
                                        <p><strong>Location:</strong> ${location}</p>
                                        <p><strong>Apply by:</strong> ${applyLastDate}</p>
                                    </div>
                                    
                                    <center><a href="https://sportalon-front-i7k9fziv8-atharvs-projects-c46e87c9.vercel.app/events/${eventId}?register=true" class="action-button">Register Now</a></center>
                                </div>
                            </div>
                            
                            <!-- Footer -->
                            <div class="footer">
                                <p>© 2025 Sportalon - The Ultimate Sports Platform</p>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
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
