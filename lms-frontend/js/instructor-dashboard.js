document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Please login first');
    window.location.href = 'index.html';
    return;
  }

  const courseList = document.getElementById('courseList');
  const form = document.getElementById('createCourseForm');

  // Fetch instructor courses
  fetch('http://localhost:5000/api/courses/instructor', {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(data => {
      courseList.innerHTML = '';

      if (data.courses.length === 0) {
        courseList.innerHTML = '<li>No courses created yet.</li>';
      } else {
        data.courses.forEach(course => {
          const li = document.createElement('li');
          li.innerHTML = `
            <strong>${course.title}</strong> - Status: ${course.status}
            <br/>
            <button onclick="showAssignmentForm(${course.course_id})">➕ Upload Assignment</button>
            <button onclick="viewEnrolledStudents(${course.course_id})">👥 View Students</button>
            <div id="assignmentForm-${course.course_id}" style="display: none; margin-top: 10px;">
              <input color="white" type="text" id="a-title-${course.course_id}" placeholder="Assignment title" />
              <input type="date" id="a-due-${course.course_id}" />
              <textarea id="a-desc-${course.course_id}" placeholder="Description"></textarea>
              <button onclick="uploadAssignment(${course.course_id})">Upload</button>
            </div>
            <div id="studentList-${course.course_id}" style="margin-top: 10px;"></div>
            <hr/>
          `;
          courseList.appendChild(li);
        });
      }
    })
    .catch(err => {
      console.error('Error fetching courses:', err);
      alert('Failed to load your courses.');
    });

  // Course creation
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const video_url = document.getElementById('video_url').value.trim();

    if (!title || !description || !video_url) {
      alert('Please fill all fields.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/courses/create-by-instructor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, video_url }),
      });

      const data = await res.json();
      alert(data.message);

      if (res.status === 201) {
        form.reset();
        location.reload();
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course.');
    }
  });
});

// Show/hide assignment upload form
function showAssignmentForm(courseId) {
  const div = document.getElementById(`assignmentForm-${courseId}`);
  div.style.display = div.style.display === 'none' ? 'block' : 'none';
}

// Upload assignment
function uploadAssignment(courseId) {
  const token = localStorage.getItem('token');
  const titleInput = document.getElementById(`a-title-${courseId}`);
  const dueDateInput = document.getElementById(`a-due-${courseId}`);
  const descInput = document.getElementById(`a-desc-${courseId}`);

  const title = titleInput.value.trim();
  const due_date = dueDateInput.value;
  const description = descInput.value.trim();

  if (!title || !due_date) {
    alert('Title and due date are required');
    return;
  }

  fetch('http://localhost:5000/api/assignments/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, description, due_date, course_id: courseId })
  })
  .then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error uploading assignment');
    }
    return data;
  })
  .then(data => {
    alert(data.message);
    // Clear form inputs
    titleInput.value = '';
    dueDateInput.value = '';
    descInput.value = '';

    // Hide form
    const formDiv = document.getElementById(`assignmentForm-${courseId}`);
    formDiv.style.display = 'none';
  })
  .catch(err => {
    console.error('Upload assignment error:', err);
    alert(err.message || 'Error uploading assignment');
  });
}

// View students enrolled in a course
function viewEnrolledStudents(courseId) {
  const token = localStorage.getItem('token');
  const container = document.getElementById(`studentList-${courseId}`);

  fetch(`http://localhost:5000/api/courses/enrolled-students/${courseId}`, {  
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.students && data.students.length > 0) {
        container.innerHTML = '<strong>Enrolled Students:</strong><ul>' +
          data.students.map(s => `<li>${s.name} (${s.email})</li>`).join('') +
          '</ul>';
      } else {
        container.innerHTML = '<strong>No students enrolled.</strong>';
      }
    })
    .catch(err => {
      console.error('Error fetching students:', err);
      alert('Could not fetch student list');
    });
}
