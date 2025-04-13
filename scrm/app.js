const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// API Routes - These should come BEFORE static file handling
app.use('/api/questions', require('./routes/questions'));
app.use('/api/answers', require('./routes/answers'));
app.use('/api/users', require('./routes/users'));

// Handle unauthorized API requests with JSON response
app.use('/api/*', (err, req, res, next) => {
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Please login'
    });
  }
  next(err);
});

// Static file serving - These should come AFTER API routes
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve index.html for all other routes (for client-side routing)
app.get('*', (req, res) => {
  // Only serve HTML for non-API routes
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  // If it's an API route, send JSON response
  if (req.path.startsWith('/api/')) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error'
    });
  }
  
  // For non-API routes, send the error page
  res.status(err.status || 500).sendFile(path.join(__dirname, 'public', 'error.html'));
});

module.exports = app; 