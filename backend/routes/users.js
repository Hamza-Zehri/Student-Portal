const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Result = require('../models/Result');

// @route   POST /api/users/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, studentId, department, semester } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    // Create user with plain text password (no hashing)
    user = await User.create({
      name,
      email,
      password, // Store as plain text
      role,
      studentId, // <-- this line must be present
      department,
      semester
    });

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        semester: user.semester
      }
    });
  } catch (error) {
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email address already exists. Please use a different email or login with existing account.' 
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }

    // Check password using bcrypt comparison
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        semester: user.semester
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      department: user.department,
      semester: user.semester
    }});
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.studentId = req.body.studentId || user.studentId;
    user.department = req.body.department || user.department;
    user.semester = req.body.semester || user.semester;

    if (req.body.password) {
      user.password = req.body.password; // Will be hashed by the pre-save middleware
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        studentId: updatedUser.studentId,
        department: updatedUser.department,
        semester: updatedUser.semester
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user (admin only)
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  if (!req.params.id || req.params.id === 'undefined') {
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  if (!req.params.id || req.params.id === 'undefined') {
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.studentId = req.body.studentId || user.studentId;
    user.department = req.body.department || user.department;
    user.semester = req.body.semester || user.semester;

    if (req.body.password) {
      user.password = req.body.password; // Will be hashed by the pre-save middleware
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        studentId: updatedUser.studentId,
        department: updatedUser.department,
        semester: updatedUser.semester
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  if (!req.params.id || req.params.id === 'undefined') {
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }
  try {
    await User.findByIdAndDelete(req.params.id);
    await Result.deleteMany({ userId: req.params.id }); // if you want to remove results too
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;