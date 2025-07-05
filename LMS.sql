create schema lms;
use lms;

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'instructor', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES Users(user_id)
);
CREATE TABLE Enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);
CREATE TABLE Assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

CREATE TABLE Submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT,
    submitted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('submitted', 'validated', 'late') DEFAULT 'submitted',
    FOREIGN KEY (assignment_id) REFERENCES Assignments(assignment_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE AssignmentSubmissions (
  submission_id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  submission_text TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES Assignments(assignment_id),
  FOREIGN KEY (student_id) REFERENCES Users(user_id)
);

ALTER TABLE AssignmentSubmissions
ADD COLUMN evaluation_status ENUM('pending', 'evaluated', 'rejected') DEFAULT 'pending',
ADD COLUMN grade VARCHAR(10) NULL,
ADD COLUMN feedback TEXT NULL;


DESCRIBE Enrollments;
SELECT * FROM Courses WHERE status = 'approved';


select * from users;
select * from courses;
select * from enrollments;
select * from assignments;
select * from assignmentsubmissions;	
truncate assignmentsubmissions;
truncate enrollments;
truncate assignments;
DELETE FROM assignmentsubmissions;
DELETE FROM assignments;
delete from courses where course_id=3;



update courses set status = "pending" where course_id = 3;
ALTER TABLE Courses ADD COLUMN video_url VARCHAR(255);
UPDATE Courses
SET video_url = 'https://www.youtube.com/watch?v=OcnBAwpMpdI'
WHERE course_id = 6;
DROP TABLE IF EXISTS Submissions;

