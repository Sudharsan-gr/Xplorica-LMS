document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  fetch('http://localhost:5000/api/assignments/submissions', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('assignmentsContainer');
    const grouped = groupByAssignment(data.submissions);

    Object.keys(grouped).forEach(assignmentId => {
      const submissions = grouped[assignmentId];
      const { assignment_title, course_title } = submissions[0];

      const assignmentDiv = document.createElement('div');
      assignmentDiv.classList.add('assignment-block');
      assignmentDiv.innerHTML = `<h3>${course_title} <br> ${assignment_title}</h3>`;

      submissions.forEach(sub => {
        const subDiv = document.createElement('div');
        subDiv.classList.add('submission-block');

        const isEvaluated = sub.evaluation_status === 'evaluated' || sub.evaluation_status === 'rejected';

        subDiv.innerHTML = `
          <p><strong>Student:</strong> ${sub.student_name}</p>
          <p><strong>Submitted:</strong> ${sub.submission_text}</p>
          <form onsubmit="return false;">
            <label>Grade:</label>
            <input type="text" id="grade-${sub.submission_id}" value="${sub.grade || ''}" ${isEvaluated ? 'disabled' : ''} /><br/>

            <label>Feedback:</label><br/>
            <textarea id="feedback-${sub.submission_id}" ${isEvaluated ? 'disabled' : ''}>${sub.feedback || ''}</textarea><br/>

            <label>Status:</label>
            <select id="status-${sub.submission_id}" ${isEvaluated ? 'disabled' : ''}>
              <option value="evaluated" ${sub.evaluation_status === 'evaluated' ? 'selected' : ''}>Evaluated</option>
              <option value="rejected" ${sub.evaluation_status === 'rejected' ? 'selected' : ''}>Rejected</option>
            </select><br/>

            ${isEvaluated
              ? '<p><em>Evaluation completed. Further changes are disabled.</em></p>'
              : `<button type="button" onclick="evaluateSubmission(${sub.submission_id}, event)">Submit Evaluation</button>`
            }
          </form>
        `;

        assignmentDiv.appendChild(subDiv);
      });

      container.appendChild(assignmentDiv);
    });
  })
  .catch(err => {
    console.error('Error loading submissions:', err);
    alert('Failed to load submissions.');
  });
});

function groupByAssignment(submissions) {
  return submissions.reduce((acc, sub) => {
    const key = sub.assignment_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(sub);
    return acc;
  }, {});
}

function evaluateSubmission(submissionId, event) {
  if (event) event.preventDefault(); // Prevent page refresh

  const token = localStorage.getItem('token');

  const grade = document.getElementById(`grade-${submissionId}`).value.trim();
  const feedback = document.getElementById(`feedback-${submissionId}`).value.trim();
  const status = document.getElementById(`status-${submissionId}`).value;

  fetch('http://localhost:5000/api/assignments/evaluate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      submission_id: submissionId,
      grade,
      feedback,
      evaluation_status: status
    })
  })
  .then(res => {
    if (!res.ok) return res.json().then(err => { throw new Error(err.message || "Evaluation failed") });
    return res.json();
  })
  .then(data => {
    alert(data.message || "Submission evaluated successfully.");
    // Optionally disable the form after success (to prevent resubmission without refresh)
    document.getElementById(`grade-${submissionId}`).disabled = true;
    document.getElementById(`feedback-${submissionId}`).disabled = true;
    document.getElementById(`status-${submissionId}`).disabled = true;

    // Hide the submit button
    event.target.closest('form').querySelector('button').style.display = 'none';

    // Show evaluation completed message
    const form = event.target.closest('form');
    let doneMsg = form.querySelector('.evaluation-completed-msg');
    if (!doneMsg) {
      doneMsg = document.createElement('p');
      doneMsg.classList.add('evaluation-completed-msg');
      doneMsg.innerHTML = '<em>Evaluation completed. Further changes are disabled.</em>';
      form.appendChild(doneMsg);
    }
  })
  .catch(err => {
    console.error("❌ Error evaluating submission:", err);
    alert(err.message || "Failed to evaluate submission.");
  });
}
