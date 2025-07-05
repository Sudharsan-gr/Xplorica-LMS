document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("Please log in first.");
    window.location.href = 'index.html';
    return;
  }

  // Fetch approved and enrolled courses
  Promise.all([
    fetch('http://localhost:5000/api/courses/approved', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),

    fetch('http://localhost:5000/api/courses/enrolled', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json())
  ])
    .then(([approvedData, enrolledData]) => {
      const approvedCourses = approvedData.courses || [];
      const enrolledCourses = enrolledData.courses || [];

      const enrolledIds = new Set(enrolledCourses.map(c => c.course_id));
      const container = document.getElementById('coursesContainer');
      container.innerHTML = '';

      if (!approvedCourses.length) {
        container.innerHTML = "<p>No approved courses found.</p>";
        return;
      }

      approvedCourses.forEach(course => {
        const isEnrolled = enrolledIds.has(course.course_id);
        const card = document.createElement('div');
        card.className = 'course-card';

        card.innerHTML = `
          <h3>${course.title}</h3>
          <p>${course.description}</p>
          <img width ="200px" src="css/img1.webp" alt="Course Image" />
           <br>
          <button onclick="${isEnrolled ? `openCourse(${course.course_id})` : `enrollCourse(${course.course_id}, this)`}">
         
      
            ${isEnrolled ? 'Open Course' : 'Enroll'}
          </button>
          
        `;

        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error('Error loading courses:', err);
      alert('Failed to load courses');
    });
});

function enrollCourse(courseId, btnElement) {
  const token = localStorage.getItem('token');
  btnElement.disabled = true;
  btnElement.textContent = "Enrolling...";

  fetch('http://localhost:5000/api/courses/enroll', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ course_id: courseId })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Enrolled successfully");
      // After enrollment, switch to Open Course button
      btnElement.textContent = "Open Course";
      btnElement.setAttribute("onclick", `openCourse(${courseId})`);
      btnElement.disabled = false;
    })
    .catch(err => {
      console.error("Error enrolling:", err);
      btnElement.textContent = "Try Again";
      btnElement.disabled = false;
    });
}

function openCourse(courseId) {
  localStorage.setItem('selectedCourseId', courseId);
  window.location.href = 'student-course.html';
}


