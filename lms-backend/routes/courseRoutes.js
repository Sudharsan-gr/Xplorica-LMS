const express = require('express');
const router = express.Router();
const {
  createCourse,
  getApprovedCourses,
  enrollInCourse,
  getEnrolledCourses,
  getCourseWithAssignment,
  getInstructorCourses,
  createCourseByInstructor,
  getStudentsInCourse
} = require('../controllers/courseController');
const authenticateToken = require('../middleware/auth');

router.post('/create', authenticateToken, createCourse);
router.get('/enrolled', authenticateToken, getEnrolledCourses);
router.get('/approved', authenticateToken, getApprovedCourses);
router.post('/enroll', authenticateToken, enrollInCourse);
router.get('/instructor', authenticateToken, getInstructorCourses);
router.post('/create-by-instructor', authenticateToken, createCourseByInstructor);
router.get('/enrolled-students/:courseId', authenticateToken, getStudentsInCourse);

// This route returns full course + assignments (+ submissions if student)
router.get('/:courseId', authenticateToken, getCourseWithAssignment);

module.exports = router;
