const db = require('../config/db');
const bcrypt = require('bcryptjs');

const ADMIN_SECRET = process.env.ADMIN_SECRET;

const signup = (req, res) => {
  const { name, email, password, role ,adminCode} = req.body;
   console.log("From frontend => adminCode:", adminCode); // 👈 Add this
  console.log("From .env => ADMIN_SECRET:", ADMIN_SECRET); 

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

    // Validate adminCode if role is admin
  if (role === 'admin' && adminCode !== ADMIN_SECRET) {
    console.log("Provided:", adminCode);
    console.log("Expected:", ADMIN_SECRET);
    return res.status(403).json({ message: 'Invalid admin code' });
  }

  // Check if user already exists
  const checkUserQuery = 'SELECT * FROM Users WHERE email = ?';
  db.query(checkUserQuery, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });

    if (results.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const insertUserQuery = 'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)';
    db.query(insertUserQuery, [name, email, hashedPassword, role], (err, results) => {
      if (err) return res.status(500).json({ message: 'Error inserting user', error: err });

      return res.status(201).json({ message: 'User registered successfully' });
    });
  });
};

const jwt = require('jsonwebtoken');
require('dotenv').config();

const login = (req, res) => {
  const { email, password } = req.body;

  // 1. Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  // 2. Check if user exists
  const query = 'SELECT * FROM Users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const user = results[0];

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    // 4. Create JWT token
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 5. Send response with token
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
};

module.exports = { signup, login };

