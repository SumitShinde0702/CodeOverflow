CodeOverflow - A StackOverflow Clone
Author: Sumit Sanjay Shinde
Student ID: A0288396E

DEPLOYMENT INSTRUCTIONS
---------------------

1. Prerequisites:
   - Node.js (v14 or higher)
   - MongoDB (v4.4 or higher)
   - npm (Node Package Manager)

2. Database Setup:
   - Install MongoDB Community Edition
   - Create a new database named 'codeoverflow'
   - Collections will be automatically created:
     * users
     * questions
     * answers

3. Project Setup:
   a. Clone the repository
   b. Install dependencies:
      ```
      npm install
      ```
   c. Create necessary directories:
      ```
      mkdir uploads
      mkdir uploads/profile_pics
      mkdir public/images
      ```
   d. Create .env file with:
      ```
      MONGODB_URI=mongodb://localhost:27017/codeoverflow (if needed)
      SESSION_SECRET=your_secret_key_here
      PORT=3000
      ```

4. Running the Application:
   - Development mode:
     ```
     npm run dev
     ```
   - Production mode:
     ```
     npm start
     ```

DATABASE SCHEMA
-------------
1. Users Collection:
2. Questions Collection:
3. Answers Collection:

FEATURES
--------
1. User Management
   - Registration
   - Login/Logout
   - Profile Management
   - Profile Picture Upload
   - Account deletion 

2. Question Management
   - Post Questions
   - Edit/Delete Questions
   - Tag System
   - Voting System
   - Sort by Newest/Hot/Unanswered

3. Answer Management
   - Post Answers
   - Edit/Delete Answers
   - Voting System

4. Additional Features
   - View list of users 
   - Search a user 
   - View details of a user
   - Search Functionality
   - Tag Filtering
   - Search a question 

TECH STACK
----------
- Frontend: EJS, Bootstrap 5, Font Awesome
- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: Express-session
- File Upload: Multer
