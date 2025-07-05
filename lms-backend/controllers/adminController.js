const db = require('../config/db');

// Check if user is admin
const isAdmin = (user) => user.role === 'admin';

const getPendingCourses = (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ message: 'Access denied' });

  const query = 'SELECT * FROM Courses WHERE status = "pending"';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.status(200).json({ pendingCourses: results });
  });
};

const approveCourse = (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ message: 'Access denied' });

  const courseId = req.params.courseId;
  const query = 'UPDATE Courses SET status = "approved" WHERE course_id = ?';

  db.query(query, [courseId], (err) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.status(200).json({ message: 'Course approved successfully' });
  });
};

const rejectCourse = (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ message: 'Access denied' });

  const courseId = req.params.courseId;
  const query = 'UPDATE Courses SET status = "rejected" WHERE course_id = ?';

  db.query(query, [courseId], (err) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.status(200).json({ message: 'Course rejected successfully' });
  });
};

module.exports = { getPendingCourses, approveCourse, rejectCourse };
