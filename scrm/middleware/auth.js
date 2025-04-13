const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    console.log('Received token:', token);
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded token:', decoded);

    if (!decoded || !decoded.uid) {
      console.log('Invalid token format - no uid found');
      return res.status(403).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    // Add user info to request using uid
    req.user = {
      id: decoded.uid
    };

    console.log('Authenticated user:', req.user);
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    
    // Check if token is expired
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = {
  authenticateToken
}; 