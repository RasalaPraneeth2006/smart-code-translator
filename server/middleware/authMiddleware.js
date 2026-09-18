import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { getDBStatus } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smart_code_translator_super_secret_jwt_key_2026';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (getDBStatus()) {
      req.user = await User.findById(decoded.id).select('-password');
    } else {
      req.user = { _id: decoded.id, name: 'Offline User' };
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid authentication token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (getDBStatus()) {
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        req.user = { _id: decoded.id };
      }
    } catch (e) {
      // Ignore token failure for optional routes
    }
  }
  next();
};
