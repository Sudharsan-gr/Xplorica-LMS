const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userroutes');
const courseRoutes = require('./routes/courseRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const adminRoutes = require('./routes/adminRoutes');




app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/admin', adminRoutes);




const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
