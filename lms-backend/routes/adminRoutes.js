const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { approveCourse, rejectCourse, getPendingCourses } = require('../controllers/adminController');

// View all pending courses
router.get('/pending-courses', authenticateToken, getPendingCourses);

// Approve a course
router.put('/approve/:courseId', authenticateToken, approveCourse);

// Reject a course
router.put('/reject/:courseId', authenticateToken, rejectCourse);

module.exports = router;
