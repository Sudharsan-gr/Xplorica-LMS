const db = require('../config/db');

// Create a new course (Instructor only)
const createCourse = (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  if (req.user.role !== 'instructor') {
    return res.status(403).json({ message: 'Access denied: only instructors can create courses' });
  }

  const query = 'INSERT INTO Courses (title, description, instructor_id, status) VALUES (?, ?, ?, ?)';
  db.query(query, [title, description, req.user.id, 'pending'], (err) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(201).json({ message: 'Course created and sent for approval' });
  });
};

// Get all approved courses
const getApprovedCourses = (req, res) => {
  const query = 'SELECT * FROM Courses WHERE status = "approved"';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json({ courses: results });
  });
};

// Enroll a student in a course
const enrollInCourse = (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can enroll in courses' });
  }

  const { course_id } = req.body;
  const studentId = req.user.id;

  const checkQuery = 'SELECT * FROM Enrollments WHERE user_id = ? AND course_id = ?';
  db.query(checkQuery, [studentId, course_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length > 0) return res.status(400).json({ message: 'You are already enrolled in this course' });

    const insertQuery = 'INSERT INTO Enrollments (user_id, course_id, enrolled_on) VALUES (?, ?, NOW())';
    db.query(insertQuery, [studentId, course_id], (err) => {
      if (err) return res.status(500).json({ message: 'Enrollment failed', error: err });
      res.status(201).json({ message: 'Enrollment successful' });
    });
  });
};

// Get all courses a student is enrolled in
const getEnrolledCourses = (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT c.course_id, c.title, c.description
    FROM Enrollments e
    JOIN Courses c ON e.course_id = c.course_id
    WHERE e.user_id = ?
  `;
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json({ courses: results });
  });
};

// ✅ Unified Course + Assignments (with submissions if student)
const getCourseWithAssignment = (req, res) => {
  const courseId = req.params.courseId;
  const userId = req.user.id;
  const userRole = req.user.role;

  const courseQuery = 'SELECT * FROM Courses WHERE course_id = ?';

  // For students: return assignments with their submissions if any
  const studentAssignmentQuery = `
    SELECT 
      a.assignment_id,
      a.title,
      a.description,
      a.due_date,
      s.submission_text,
      s.evaluation_status,
      s.grade,
      s.feedback
    FROM Assignments a
    LEFT JOIN AssignmentSubmissions s
      ON a.assignment_id = s.assignment_id AND s.student_id = ?
    WHERE a.course_id = ?
  `;

  // For instructors or admins: just return assignments
  const instructorAssignmentQuery = 'SELECT * FROM Assignments WHERE course_id = ?';

  db.query(courseQuery, [courseId], (err, courseResults) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });

    if (courseResults.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const assignmentsQuery = (userRole === 'student') ? studentAssignmentQuery : instructorAssignmentQuery;
    const assignmentParams = (userRole === 'student') ? [userId, courseId] : [courseId];

    db.query(assignmentsQuery, assignmentParams, (err, assignmentResults) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });

      // Add 'submitted' boolean for frontend ease
      const enhancedAssignments = assignmentResults.map(a => ({
        ...a,
        submitted: !!a.submission_text
      }));

      res.status(200).json({
        course: courseResults[0],
        assignments: enhancedAssignments
      });
    });
  });
};


// Instructor’s course list
const getInstructorCourses = (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const instructorId = req.user.id;
  const query = 'SELECT * FROM Courses WHERE instructor_id = ?';
  db.query(query, [instructorId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json({ courses: results });
  });
};

// Course with video_url
const createCourseByInstructor = (req, res) => {
  const { title, description, video_url } = req.body;

  if (!title || !description || !video_url) {
    return res.status(400).json({ message: 'Title, description, and video URL are required' });
  }

  if (req.user.role !== 'instructor') {
    return res.status(403).json({ message: 'Access denied: only instructors can create courses' });
  }

  const query = 'INSERT INTO Courses (title, description, instructor_id, status, video_url) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [title, description, req.user.id, 'pending', video_url], (err) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(201).json({ message: 'Course created and sent for approval' });
  });
};

// Get all students in a course
const getStudentsInCourse = (req, res) => {
  const courseId = req.params.courseId;
  const user = req.user;

  if (!user || user.role !== 'instructor') {
    return res.status(403).json({ message: 'Only instructors can view enrolled students' });
  }

  const instructorCheckQuery = 'SELECT * FROM Courses WHERE course_id = ? AND instructor_id = ?';
  db.query(instructorCheckQuery, [courseId, user.id], (err, courses) => {
    if (err) return res.status(500).json({ message: 'DB error (instructor check)', error: err });
    if (courses.length === 0) {
      return res.status(403).json({ message: 'You are not authorized for this course' });
    }

    const studentQuery = `
      SELECT u.user_id, u.name, u.email
      FROM Enrollments e
      JOIN Users u ON e.user_id = u.user_id
      WHERE e.course_id = ?
    `;
    db.query(studentQuery, [courseId], (err, results) => {
      if (err) return res.status(500).json({ message: 'DB error (student query)', error: err });
      res.status(200).json({ students: results });
    });
  });
};

module.exports = {
  createCourse,
  getApprovedCourses,
  enrollInCourse,
  getEnrolledCourses,
  getCourseWithAssignment,
  getInstructorCourses,
  createCourseByInstructor,
  getStudentsInCourse
};
