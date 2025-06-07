const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    prn_number: {
      type: String,
      required: true,
      sparse: true,
      unique: true,
    },
    mobile_number: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10}$/, "Please enter a valid 10-digit mobile number"],
    },
    profile_picture: {
      type: String, // URL of profile picture
    },
    collegeid: {
      type: String, // URL of college ID
    },
    department: {
      type: String,
      enum: ["IT", "CS", "EnTC", "Mech", "Biotech", "Civil", "Electrical"],
    },
    year: {
      type: String,
      enum: ["FE", "SE", "TE", "BE"],
    },
    age: {
      type: Number,
      min: 16,
    },
    user_type: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    description: {
      type: String,
    },
    address: {
      type: String,
    },
    sports_interest: {
      type: String,
    },
    achievements: {
      type: String,
    },
    isVerifiedByAdmin: {
      type: Boolean,
      default: false,
    },
    registeredEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
