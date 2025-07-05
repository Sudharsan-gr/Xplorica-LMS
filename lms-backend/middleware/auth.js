const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Token format: "Bearer token"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });

    req.user = user; // attach user info to request (id, role)
    next();
  });
};

module.exports = authenticateToken;
