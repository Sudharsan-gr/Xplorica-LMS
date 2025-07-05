const db = require('../config/db');

const uploadAssignment = (req, res) => {
  const { title, description, course_id, due_date } = req.body;

  if (req.user.role !== 'instructor') {
    return res.status(403).json({ message: 'Only instructors can upload assignments' });
  }

  if (!title || !course_id || !due_date) {
    return res.status(400).json({ message: 'Title, course ID, and due date are required' });
  }

  const query = `
    INSERT INTO Assignments (title, description, course_id, due_date)
    VALUES (?, ?, ?, ?)`;

  db.query(query, [title, description || null, course_id, due_date], (err, result) => {
    if (err) {
      console.error('DB error uploading assignment:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }

    res.status(201).json({ message: 'Assignment uploaded successfully' });
  });
};


const getStudentAssignments = (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can view assignments' });
  }

  const studentId = req.user.id;

  const query = `
    SELECT 
      a.assignment_id,
      a.title,
      a.description,
      a.due_date,
      c.title AS course_title,
      s.submission_text,
      s.evaluation_status,
      s.grade,
      s.feedback
    FROM Assignments a
    JOIN Courses c ON a.course_id = c.course_id
    JOIN Enrollments e ON e.course_id = a.course_id
    LEFT JOIN AssignmentSubmissions s 
      ON s.assignment_id = a.assignment_id AND s.student_id = ?
    WHERE e.user_id = ?
    ORDER BY a.due_date ASC
  `;

  db.query(query, [studentId, studentId], (err, results) => {
    if (err) {
      console.error('DB error fetching assignments:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }

    // Add a 'submitted' flag to indicate if student has submitted this assignment
    const assignmentsWithFlag = results.map(assignment => ({
      ...assignment,
      submitted: assignment.submission_text !== null && assignment.submission_text !== ''
    }));

    res.status(200).json({ assignments: assignmentsWithFlag });
  });
};


const submitAssignment = (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can submit assignments' });
  }

  const { assignment_id, submission_text } = req.body;
  const student_id = req.user.id;

  if (!assignment_id || !submission_text) {
    return res.status(400).json({ message: 'Assignment ID and submission text are required' });
  }

  const checkQuery = 'SELECT * FROM AssignmentSubmissions WHERE student_id = ? AND assignment_id = ?';
  db.query(checkQuery, [student_id, assignment_id], (err, results) => {
    if (err) {
      console.error('DB error on check submission:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'You have already submitted this assignment.' });
    }

    const insertQuery = `
      INSERT INTO AssignmentSubmissions (assignment_id, student_id, submission_text, submitted_at)
      VALUES (?, ?, ?, NOW())`;

    db.query(insertQuery, [assignment_id, student_id, submission_text], (err, result) => {
      if (err) {
        console.error('DB error on insert submission:', err);
        return res.status(500).json({ message: 'Database error', error: err });
      }

      res.status(201).json({ message: 'Assignment submitted successfully' });
    });
  });
};

const getSubmissionsForInstructor = (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ message: 'Only instructors can view submissions' });
  }

  const instructorId = req.user.id;

  const query = `
    SELECT 
      s.submission_id,
      s.submission_text,
      s.submitted_at,
      s.evaluation_status,
      s.grade,
      s.feedback,
      a.assignment_id,
      a.title AS assignment_title,
      u.user_id AS student_id,
      u.name AS student_name,
      c.course_id,
      c.title AS course_title
    FROM AssignmentSubmissions s
    JOIN Assignments a ON s.assignment_id = a.assignment_id
    JOIN Courses c ON a.course_id = c.course_id
    JOIN Users u ON s.student_id = u.user_id
    WHERE c.instructor_id = ?
    ORDER BY s.submitted_at DESC
  `;

  db.query(query, [instructorId], (err, results) => {
    if (err) {
      console.error('DB error fetching submissions:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.status(200).json({ submissions: results });
  });
};

// Instructor evaluates a submission: set grade, feedback, evaluation_status
const evaluateSubmission = (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ message: 'Only instructors can evaluate submissions' });
  }

  const { submission_id, grade, feedback, evaluation_status } = req.body;

  if (!submission_id || !evaluation_status) {
    return res.status(400).json({ message: 'Submission ID and evaluation status are required' });
  }

  // Validate evaluation_status value
  const validStatuses = ['pending', 'evaluated', 'rejected'];
  if (!validStatuses.includes(evaluation_status)) {
    return res.status(400).json({ message: 'Invalid evaluation status' });
  }

  const checkQuery = 'SELECT evaluation_status FROM AssignmentSubmissions WHERE submission_id = ?';
  db.query(checkQuery, [submission_id], (err, results) => {
    if (err) {
      console.error('DB error on check evaluation:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const currentStatus = results[0].evaluation_status;
    if (currentStatus === 'evaluated' || currentStatus === 'rejected') {
      return res.status(400).json({ message: 'This submission has already been evaluated.' });
    }

    const query = `
      UPDATE AssignmentSubmissions
      SET grade = ?, feedback = ?, evaluation_status = ?
      WHERE submission_id = ?
    `;

    db.query(query, [grade || null, feedback || null, evaluation_status, submission_id], (err, result) => {
      if (err) {
        console.error('DB error updating evaluation:', err);
        return res.status(500).json({ message: 'Database error', error: err });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      res.status(200).json({ message: 'Submission evaluated successfully' });
    });
  });
};

module.exports = {
  uploadAssignment,
  getStudentAssignments,
  submitAssignment,
  getSubmissionsForInstructor,
  evaluateSubmission
};
