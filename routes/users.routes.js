const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    getAllUsersHandler,
    getUserHandler,
    getUserByIdHandler,
    addUserHandler,
    deleteUserHandler,
    updateUserHandler,
    upload,
    changePasswordHandler,
    deleteAccountHandler
} = require("../handlers/users.handlers");

// Set up multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile_pics');  // Folder where profile pictures will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Unique filename
    }
});

const uploadMulter = multer({ storage: storage });

function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.redirect("/login");
    }
}

// Route for listing all users should be first
router.get('/', getAllUsersHandler);

// Other user routes
router.get('/profile', requireAuth, getUserHandler);
router.post('/change-password', requireAuth, changePasswordHandler);

// User routes
router.get("/:id", getUserByIdHandler);
router.get('/details/:id', getUserByIdHandler);

// Admin routes
router.post("/delete/:id", requireAuth, deleteUserHandler);

// Add this route for account deletion
router.post("/delete-account", requireAuth, deleteAccountHandler);

// Profile update route with file upload
router.post("/profile", requireAuth, uploadMulter.single('profilePicture'), updateUserHandler);

module.exports = router;
