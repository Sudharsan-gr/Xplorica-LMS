const express = require('express');
const router = express.Router();
const { uploadAssignment, getStudentAssignments, submitAssignment, getSubmissionsForInstructor,evaluateSubmission } = require('../controllers/assignmentController');
const authenticateToken = require('../middleware/auth');

// Instructor uploads a new assignment
router.post('/upload', authenticateToken, uploadAssignment);

// Student gets their assignments
router.get('/my', authenticateToken, getStudentAssignments);

// Student submits assignment
router.post('/submit', authenticateToken, submitAssignment);

// Instructor views submissions for evaluation
router.get('/submissions', authenticateToken, getSubmissionsForInstructor);

// Instructor evaluates a submission (grade, feedback, status)
router.post('/evaluate', authenticateToken, evaluateSubmission);

module.exports = router;
