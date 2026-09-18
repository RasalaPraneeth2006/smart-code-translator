import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { getDBStatus } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smart_code_translator_super_secret_jwt_key_2026';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// In-memory user database fallback when MongoDB is offline
const inMemoryUsers = [];

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide name, email, and password.' });
    }

    if (getDBStatus()) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, error: 'User already exists with this email.' });
      }

      const user = await User.create({ name, email, password });
      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        data: {
          token,
          user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
        },
      });
    }

    // In-memory fallback mode
    const existing = inMemoryUsers.find(u => u.email === email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'User already exists with this email.' });
    }

    const newUser = { _id: `usr_${Date.now()}`, name, email, password };
    inMemoryUsers.push(newUser);
    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { _id: newUser._id, name: newUser.name, email: newUser.email },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password.' });
    }

    if (getDBStatus()) {
      const user = await User.findOne({ email });
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, error: 'Invalid credentials.' });
      }

      const token = generateToken(user._id);
      return res.status(200).json({
        success: true,
        data: {
          token,
          user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
        },
      });
    }

    // In-memory fallback check
    const user = inMemoryUsers.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const token = generateToken(user._id);
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { credential, email, name, picture, googleId } = req.body;

    const userEmail = email || `google_${googleId || Date.now()}@example.com`;
    const userName = name || 'Google Developer';

    if (getDBStatus()) {
      let user = await User.findOne({ email: userEmail });
      if (!user) {
        user = await User.create({
          name: userName,
          email: userEmail,
          googleId: googleId || `g_${Date.now()}`,
          avatar: picture || '',
        });
      }
      const token = generateToken(user._id);
      return res.status(200).json({
        success: true,
        data: { token, user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar } },
      });
    }

    const mockId = `usr_g_${Date.now()}`;
    const token = generateToken(mockId);
    return res.status(200).json({
      success: true,
      data: { token, user: { _id: mockId, name: userName, email: userEmail, avatar: picture || '' } },
    });
  } catch (error) {
    next(error);
  }
};
