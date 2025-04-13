const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const userRoutes = require('./routes/users');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Auth headers:', req.headers);
    console.log('Token:', token);

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, 'afanifioeosnefnwir3in23in2', (err, decoded) => {
      if (err) {
        console.log('Token verification failed:', err);
        return res.status(403).json({ message: 'Invalid token' });
      }

      console.log('Decoded token:', decoded);
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/questions', require('./routes/questions'));
app.use('/api/answers', require('./routes/answers'));

// API 404 handler
app.use('/api/*', (req, res) => {
  console.log('API 404:', req.method, req.originalUrl);
  res.status(404).json({ message: 'API endpoint not found' });
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (req.path.startsWith('/api/')) {
    return res.status(err.status || 500).json({ 
      message: err.message || 'Internal server error'
    });
  }
  
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 