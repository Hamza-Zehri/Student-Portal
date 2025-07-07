const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Result = require('../models/Result');
const Course = require('../models/Course');
const User = require('../models/User');

// @route   POST /api/results
// @desc    Add a result (admin only)
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId, courseId, score } = req.body;

    // Check if result already exists for this user and course
    const existingResult = await Result.findOne({ userId, courseId });
    if (existingResult) {
      return res.status(400).json({ 
        success: false, 
        error: 'Result already exists for this student and course' 
      });
    }

    const newResult = new Result({
      userId,
      courseId,
      score
    });

    const savedResult = await newResult.save();
    
    // Populate user and course details
    await savedResult.populate('userId', 'name email studentId');
    await savedResult.populate('courseId', 'courseName courseCode credits');

    res.status(201).json({
      success: true,
      data: savedResult
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Result creation failed: ' + error.message
    });
  }
});

// @route   GET /api/results
// @desc    Get all results (admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const results = await Result.find()
      .populate('userId', 'name studentId email')
      .populate('courseId', 'courseName courseCode')
      .sort({ dateAchieved: -1 });

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/results/student/:userId
// @desc    Get all results for a student
// @access  Private
router.get('/student/:userId', protect, async (req, res) => {
    try {
        // Check if user is admin or the student themselves
        if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to view these results'
            });
        }

        const results = await Result.find({ userId: req.params.userId })
            .populate('courseId', 'courseCode courseName credits')
            .populate('userId', 'name studentId')
            .sort({ dateAchieved: -1 });

        // Calculate CGPA
        let totalPoints = 0;
        let totalCredits = 0;

        for (const result of results) {
            if (result.courseId && result.courseId.credits !== undefined) {
                totalPoints += result.gradePoint * result.courseId.credits;
                totalCredits += result.courseId.credits;
            }
        }

        const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                results,
                cgpa,
                totalCredits
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// @route   GET /api/results/course/:courseId
// @desc    Get all results for a course (admin only)
// @access  Private/Admin
router.get('/course/:courseId', protect, authorize('admin'), async (req, res) => {
    try {
        const results = await Result.find({ courseId: req.params.courseId })
            .populate('userId', 'name studentId')
            .sort('userId');

        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// @route   PUT /api/results/:id
// @desc    Update a result (admin only)
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await Result.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('userId', 'name email studentId')
         .populate('courseId', 'courseName courseCode credits');

        if (!result) {
            return res.status(404).json({ success: false, error: 'Result not found' });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// @route   DELETE /api/results/:id
// @desc    Delete a result (admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const result = await Result.findByIdAndDelete(req.params.id);

        if (!result) {
            return res.status(404).json({ success: false, error: 'Result not found' });
        }

        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;