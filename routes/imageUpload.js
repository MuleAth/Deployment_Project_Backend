const express = require('express');
const router = express.Router();
const upload = require('../utils/fileUpload');
const path = require('path');

// Route to handle image uploads
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Create URL for the uploaded file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const relativePath = `/uploads/${req.file.filename}`;
    const imageUrl = `${baseUrl}${relativePath}`;

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Error handling middleware for multer errors
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 5MB.'
    });
  }
  
  res.status(400).json({
    success: false,
    message: err.message || 'Error processing file upload'
  });
});

module.exports = router;