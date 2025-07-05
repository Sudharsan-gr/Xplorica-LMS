const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Login Logic
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch('http://localhost:5000/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      alert("Login successful");

  if (data.user.role === 'admin') {
        window.location.href = 'admin-approval.html';  // your admin dashboard page
      } else if (data.user.role === 'instructor') {
        window.location.href = 'instructor-dashboard.html';  // instructor dashboard
      } else {
        window.location.href = 'student-dashboard.html';  // student dashboard
      }    } else {
      alert(data.message);
    }
  });
}

// Signup Logic
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const adminCode = document.getElementById('adminCode')?.value || null;
    console.log({ name, email, password, role, adminCode });

    const res = await fetch('http://localhost:5000/api/users/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role,adminCode:adminCode }),
    });

    const data = await res.json();
    alert(data.message);
    if (res.status === 201) {
      window.location.href = "index.html";
    }
  });
}
