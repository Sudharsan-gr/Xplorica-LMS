document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Please log in as admin first.');
    window.location.href = 'index.html';
    return;
  }

  fetchPendingCourses(token);
});

function fetchPendingCourses(token) {
  fetch('http://localhost:5000/api/admin/pending-courses', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('coursesContainer');
    container.innerHTML = '';

    if (!data.pendingCourses || data.pendingCourses.length === 0) {
      container.innerHTML = '<p>No pending courses found.</p>';
      return;
    }

    data.pendingCourses.forEach(course => {
      const courseDiv = document.createElement('div');
      courseDiv.className = 'course-card';

      courseDiv.innerHTML = `
        <h3>${course.title}</h3>
        <p>${course.description}</p>
        <button onclick="approveCourse(${course.course_id})">Approve</button>
        <button onclick="rejectCourse(${course.course_id})">Reject</button>
      `;

      container.appendChild(courseDiv);
    });
  })
  .catch(err => {
    console.error('Error fetching pending courses:', err);
    alert('Failed to fetch pending courses.');
  });
}

function approveCourse(courseId) {
  const token = localStorage.getItem('token');
  fetch(`http://localhost:5000/api/admin/approve/${courseId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message || 'Course approved');
    fetchPendingCourses(token);
  })
  .catch(err => {
    console.error('Error approving course:', err);
    alert('Failed to approve course.');
  });
}

function rejectCourse(courseId) {
  const token = localStorage.getItem('token');
  fetch(`http://localhost:5000/api/admin/reject/${courseId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message || 'Course rejected');
    fetchPendingCourses(token);
  })
  .catch(err => {
    console.error('Error rejecting course:', err);
    alert('Failed to reject course.');
  });
}
