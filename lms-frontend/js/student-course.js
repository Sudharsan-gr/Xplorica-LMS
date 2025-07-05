document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const courseId = localStorage.getItem('selectedCourseId');

  if (!token || !courseId) {
    alert("Course not found or unauthorized.");
    window.location.href = 'student-dashboard.html';
    return;
  }

  fetch(`http://localhost:5000/api/courses/${courseId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to load course data');
      return res.json();
    })
    .then(data => {
      const course = data.course;
      const assignments = data.assignments || [];

      // Set course title & description
      document.getElementById('courseTitle').innerText = course.title;
      document.getElementById('courseDescription').innerText = course.description;

      // Embed YouTube video
      const videoId = extractYouTubeId(course.video_url);
      document.getElementById('videoContainer').innerHTML = videoId
        ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`
        : "<p>No video available.</p>";

      // Render assignments section
      const assignmentSection = document.getElementById('assignmentSection');
     

      if (assignments.length === 0) {
        assignmentSection.innerHTML += '<p>No assignments posted yet.</p>';
        return;
      }

      assignments.forEach(assignment => {
  const submitted = assignment.submitted; // true if submitted
  const submissionText = assignment.submission_text || '';

  const assignmentDiv = document.createElement('div');
  assignmentDiv.style.border = '1px solid #ccc';
  assignmentDiv.style.padding = '10px';
  assignmentDiv.style.marginBottom = '20px';
  assignmentDiv.style.borderRadius = '8px';

 assignmentDiv.innerHTML = `
  <h4>${assignment.title}</h4>
  <p>${assignment.description}</p>
  ${
    submitted
      ? `
        <p style="color: green;"><strong>Assignment submitted.</strong></p>
        <p><strong>Your answer:</strong><br>${escapeHtml(submissionText)}</p>
        ${
          assignment.evaluation_status === 'evaluated'
            ? `<p style="color: blue;"><strong>Evaluation Result:</strong><br>Grade: ${assignment.grade || 'N/A'}<br>Feedback: ${escapeHtml(assignment.feedback || '')}</p>`
            : `<p style="color: orange;"><strong>Status:</strong> ${assignment.evaluation_status || 'Pending evaluation'}</p>`
        }
      `
      : `
        <textarea id="answer-${assignment.assignment_id}" rows="4" cols="50" placeholder="Write your answer here..."></textarea><br/>
        <button class="subbtn" id="submitBtn-${assignment.assignment_id}" onclick="submitAssignment(${assignment.assignment_id})">Submit Assignment</button>
      `
  }
`;


  assignmentSection.appendChild(assignmentDiv);
});

    })
    .catch(err => {
      console.error("Error loading course:", err);
      alert("Failed to load course. Please try again.");
      window.location.href = 'student-dashboard.html';
    });
});

function submitAssignment(assignmentId) {
  const token = localStorage.getItem('token');
  const answerInput = document.getElementById(`answer-${assignmentId}`);

  if (!answerInput) return alert("Answer field not found.");
  const submissionText = answerInput.value.trim();

  if (!submissionText) {
    alert("Please enter your answer.");
    return;
  }

  fetch('http://localhost:5000/api/assignments/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assignment_id: assignmentId,
      submission_text: submissionText
    })
  })
  .then(res => {
    if (!res.ok) return res.json().then(data => { throw new Error(data.message || "Submission failed"); });
    return res.json();
  })
  .then(data => {
    alert(data.message || "Assignment submitted successfully.");

    // Update UI for this assignment:
    // 1. Disable textarea and button
    answerInput.style.display = 'none'; // Hides it from view
    const submitBtn = document.getElementById(`submitBtn-${assignmentId}`);
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.display = 'none';  // Or just disable it if you prefer
    }
    

    // 2. Show "Submitted, waiting for evaluation" message
    const parentDiv = answerInput.parentElement;
    const statusMessage = document.createElement('p');
    statusMessage.style.color = 'green';
    statusMessage.innerHTML = `<strong>Assignment submitted.</strong> Waiting for evaluation. <br><strong>Your answer:</strong><br>${escapeHtml(submissionText)}`;
    parentDiv.appendChild(statusMessage);
  })
  .catch(err => {
    alert(err.message || "Failed to submit assignment. Please try again.");
  });
}

function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}
