const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Event title is required"],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"]
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"]
  },
  location: {
    type: String,
    required: [true, "Location is required"],
    trim: true
  },
  organizer: {
    type: String,
    required: [true, "Organizer is required"],
    trim: true
  },
  contact: {
    type: String,
    required: [true, "Contact information is required"],
    trim: true
  },
  description: {
    type: String,
    required: [true, "Description is required"]
  },
  rules: {
    type: String,
    required: [true, "Rules are required"]
  },
  prizes: {
    type: String,
    required: [true, "Prize details are required"]
  },
  sportsCategory: {
    type: String,
    required: [true, "Sports category is required"]
  },
  imageUrl: {
    type: String,
    default: "https://tiemdelhi.com/blogs/wp-content/uploads/2023/03/sports-1024x683.jpg"
  },
  applyLastDate:{
    type: Date,
  },
  coordinator_name:{
    type: String,
  },
  coordinator_no:{
    type: String,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });


eventSchema.pre("validate", function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error("End date must be after start date"));
  } else {
    next();
  }
});

module.exports = mongoose.model("Event", eventSchema);