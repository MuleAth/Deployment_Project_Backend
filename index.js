const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/auth");
const feedback = require("./routes/feedback");
const adminRoutes = require("./routes/adminUsers");
const eventRoutes = require("./routes/adminEvents");
const equipmentRoutes = require("./routes/adminEquipment");
const recommendationRoutes = require("./routes/recommendations");
const imageUploadRoutes = require("./routes/imageUpload");

const updateProfileRoutes = require("./routes/updateProfile");

const frontendEvent = require("./routes/frontendEvents");
const frontendEquipment = require("./routes/frontendEquipment");

dotenv.config();

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected Sucessfully`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); 
  }
};
connectDB();
const app = express();

app.use(cookieParser());

app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://your-frontend-domain.vercel.app" // We'll update this after deploying frontend
  ], 
  credentials: true, 
}));

// Middleware
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/feedback", feedback);
app.use("/api/admin/users", adminRoutes);
app.use("/api/admin/events", eventRoutes);
app.use("/api/admin/equipment", equipmentRoutes);
app.use("/api/upload", imageUploadRoutes);

//userRoutes:
app.use("/api/user/getevent", frontendEvent);
app.use("/api/user/equipment", frontendEquipment);
app.use("/api/user/profile", updateProfileRoutes);
app.use("/api/recommendations", recommendationRoutes);



// Test Route
app.get("/", (req, res) => {
  res.send("Sports Recommendation Platform Backend is Running 🚀");
});

app.get("/test-cookie", (req, res) => {
  console.log("Cookies received:", req.cookies.token); // Debugging: Logs cookies in the backend
  res.json({ receivedCookies: req.cookies });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
