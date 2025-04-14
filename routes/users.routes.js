const express = require("express");
const router = express.Router();
const upload = require('../lib/upload');
const {
    getAllUsersHandler,
    getUserHandler,
    getUserByIdHandler,
    addUserHandler,
    deleteUserHandler,
    updateUserHandler,
    changePasswordHandler,
    deleteAccountHandler,
    requireAuthJWT,
    loginHandler,
    getUserQuestionsHandler,
    getUserAnswersHandler
} = require("../handlers/users.handlers");

function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.redirect("/login");
    }
}

// Public routes
router.post('/login', loginHandler);
router.get('/', getAllUsersHandler);

// Protected routes - specific paths first
router.get('/profile', requireAuthJWT, getUserHandler);
router.post('/profile', requireAuthJWT, upload.single('profilePicture'), updateUserHandler);
router.post('/password', requireAuthJWT, changePasswordHandler);
router.delete('/delete-account', requireAuthJWT, deleteAccountHandler);

// Registration route with file upload
router.post('/', upload.single('profilePicture'), (req, res, next) => {
    console.log('Received registration request');
    console.log('Files:', req.file);
    console.log('Body:', req.body);
    next();
}, addUserHandler);

// Parameterized routes last
router.get('/:id', getUserByIdHandler);
router.get('/:id/questions', getUserQuestionsHandler);
router.get('/:id/answers', getUserAnswersHandler);
router.delete('/:id', requireAuthJWT, deleteUserHandler);

module.exports = router;
