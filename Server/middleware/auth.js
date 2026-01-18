const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Basic authentication
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated' });
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Check if user is a client
const isClient = (req, res, next) => {
  if (req.userRole === 'client' || req.userRole === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Client access required' });
  }
};

// Check if user is a seller
const isSeller = (req, res, next) => {
  if (req.userRole === 'seller' || req.userRole === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Seller access required' });
  }
};

// Check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.userRole === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

module.exports = { auth, isClient, isSeller, isAdmin };