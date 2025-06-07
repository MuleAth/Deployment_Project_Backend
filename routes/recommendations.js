const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Helper function to check if Python is available
const isPythonAvailable = () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", ["--version"]);

    pythonProcess.on("error", (error) => {
      console.error("Python is not available:", error);
      reject(error);
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`Python check failed with code ${code}`));
      }
    });
  });
};

// Helper function to check if the recommendation script exists
const doesScriptExist = (scriptPath) => {
  return fs.existsSync(scriptPath);
};

// Get recommendations for a specific user
router.get("/user/:userId", async (req, res) => {
  const userId = req.params.userId;
  console.log(`Received recommendation request for user ID: ${userId}`);

  // Check if userId is valid
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required"
    });
  }

  // Path to the recommendation script
  const scriptPath = path.join(__dirname, "../ml_recommendations/get_recommendations.py");

  // Check if the script exists
  if (!doesScriptExist(scriptPath)) {
    console.error(`Recommendation script not found at: ${scriptPath}`);
    return res.status(500).json({
      success: false,
      message: "Server configuration error: Recommendation script not found"
    });
  }

  try {
    // Check if Python is available
    await isPythonAvailable();

    console.log(`Spawning Python process for user ${userId} with script: ${scriptPath}`);

    // Create a temporary file to store recommendations
    const tempOutputFile = path.join(__dirname, `../temp_${userId}_recommendations.json`);

    // Spawn a Python process to run the recommendation script
    const pythonProcess = spawn("python", [scriptPath, userId]);

    let dataString = "";
    let errorString = "";

    // Collect data from the Python script
    pythonProcess.stdout.on("data", (data) => {
      const chunk = data.toString();
      console.log(`Python stdout chunk: ${chunk}`);
      dataString += chunk;
    });

    // Handle errors
    pythonProcess.stderr.on("data", (data) => {
      const errorChunk = data.toString();
      console.error(`Python Error: ${errorChunk}`);
      errorString += errorChunk;
    });

    // When the Python process exits
    pythonProcess.on("close", (code) => {
      console.log(`Python process exited with code ${code}`);

      if (code !== 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate recommendations",
          error: `Python process exited with code ${code}. Error: ${errorString}`
        });
      }

      try {
        // Log the raw data for debugging
        console.log(`Raw recommendation data for user ${userId}:`, dataString);

        // Clean the data string (remove any non-JSON content)
        const jsonStartIndex = dataString.indexOf('[');
        const jsonEndIndex = dataString.lastIndexOf(']') + 1;

        if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
          const cleanJsonString = dataString.substring(jsonStartIndex, jsonEndIndex);
          console.log(`Cleaned JSON string: ${cleanJsonString}`);

          // Parse the JSON output from the Python script
          const recommendations = JSON.parse(cleanJsonString);

          // Log the parsed recommendations
          console.log(`Parsed recommendations for user ${userId}:`, recommendations);

          return res.status(200).json({
            success: true,
            recommendations
          });
        } else {
          // If no valid JSON found, try to parse the entire string
          const recommendations = JSON.parse(dataString);

          return res.status(200).json({
            success: true,
            recommendations
          });
        }
      } catch (error) {
        console.error(`Error parsing recommendation data for user ${userId}:`, error);
        console.error("Raw data that failed to parse:", dataString);

        // Try to return at least some data if possible
        if (dataString.includes('[') && dataString.includes(']')) {
          try {
            // Try to extract JSON array from the string
            const startIdx = dataString.lastIndexOf('[');
            const endIdx = dataString.lastIndexOf(']') + 1;

            if (startIdx >= 0 && endIdx > startIdx) {
              const jsonArray = dataString.substring(startIdx, endIdx);
              console.log("Extracted JSON array:", jsonArray);

              const parsedArray = JSON.parse(jsonArray);
              return res.status(200).json({
                success: true,
                recommendations: parsedArray
              });
            }
          } catch (e) {
            console.error("Failed to extract JSON array:", e);
          }
        }

        // If all else fails, return an empty array with success=true to avoid frontend errors
        return res.status(200).json({
          success: true,
          recommendations: [],
          warning: "Failed to parse recommendation data, returning empty array"
        });
      }
    });
  } catch (error) {
    console.error("Error in recommendation process:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while generating recommendations",
      error: error.message
    });
  }
});

// Get recommendations for all users
router.get("/all-users", async (req, res) => {
  console.log("Received request for recommendations for all users");

  // Path to the recommendation script
  const scriptPath = path.join(__dirname, "../ml_recommendations/get_all_recommendations.py");

  // Check if the script exists
  if (!doesScriptExist(scriptPath)) {
    console.error(`All-users recommendation script not found at: ${scriptPath}`);
    return res.status(500).json({
      success: false,
      message: "Server configuration error: All-users recommendation script not found"
    });
  }

  try {
    // Check if Python is available
    await isPythonAvailable();

    console.log(`Spawning Python process for all users with script: ${scriptPath}`);

    // Spawn a Python process to run the recommendation script for all users
    const pythonProcess = spawn("python", [scriptPath]);

    let dataString = "";
    let errorString = "";

    // Collect data from the Python script
    pythonProcess.stdout.on("data", (data) => {
      const chunk = data.toString();
      console.log(`Python stdout chunk for all users: ${chunk.substring(0, 100)}...`);
      dataString += chunk;
    });

    // Handle errors
    pythonProcess.stderr.on("data", (data) => {
      const errorChunk = data.toString();
      console.error(`Python Error for all users: ${errorChunk}`);
      errorString += errorChunk;
    });

    // When the Python process exits
    pythonProcess.on("close", (code) => {
      console.log(`Python process for all users exited with code ${code}`);

      if (code !== 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate recommendations for all users",
          error: `Python process exited with code ${code}. Error: ${errorString}`
        });
      }

      try {
        // Parse the JSON output from the Python script
        const recommendations = JSON.parse(dataString);

        return res.status(200).json({
          success: true,
          recommendations
        });
      } catch (error) {
        console.error("Error parsing recommendation data for all users:", error);
        console.error("Raw data that failed to parse (first 200 chars):", dataString.substring(0, 200));

        // Return empty array with success=true to avoid frontend errors
        return res.status(200).json({
          success: true,
          recommendations: [],
          warning: "Failed to parse recommendation data for all users, returning empty array"
        });
      }
    });
  } catch (error) {
    console.error("Error in all-users recommendation process:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while generating recommendations for all users",
      error: error.message
    });
  }
});

// Test endpoint to check if Python is working
router.get("/test", async (req, res) => {
  console.log("Testing Python availability");

  try {
    // Check if Python is available
    await isPythonAvailable();

    // Run a simple Python command
    const pythonProcess = spawn("python", ["-c", "print('Python is working!')"]);

    let dataString = "";
    let errorString = "";

    // Collect data from the Python script
    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });

    // Handle errors
    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString();
    });

    // When the Python process exits
    pythonProcess.on("close", (code) => {
      if (code === 0) {
        return res.status(200).json({
          success: true,
          message: "Python is working correctly",
          output: dataString.trim()
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Python test failed",
          error: errorString,
          code
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Python is not available",
      error: error.message
    });
  }
});

module.exports = router;