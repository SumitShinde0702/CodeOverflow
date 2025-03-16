const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    getAllUsersHandler,
    getUserHandler,
    getUserByIdHandler,
    updateUserHandler,
    deleteUserHandler,
    upload,
    changePasswordHandler
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

// Profile routes
router.get("/profile", requireAuth, getUserHandler);
router.post("/profile", requireAuth, uploadMulter.single('profilePicture'), updateUserHandler);

// User routes
router.get("/:id", requireAuth, getUserByIdHandler);

// Admin routes
router.get("/", requireAuth, getAllUsersHandler);
router.post("/delete/:id", requireAuth, deleteUserHandler);

router.post('/change-password', requireAuth, changePasswordHandler);

module.exports = router;
