const express = require('express');
const router = express.Router();
const { signup,login } = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');


router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: 'Welcome!', user: req.user });
});


module.exports = router;
