const { 
    insertUser,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUser,
    getUserByUsername,
    getAllAnswersByUserId,
    changePassword,
    getQuestionById
} = require("../lib/database");
const { ObjectId } = require('mongodb');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile_pics');  // Folder where profile pictures will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Unique filename
    }
});

const upload = multer({ storage: storage });

const getAllUsersHandler = async (req, res) => {
    try {
        const users = await getAllUsers();
        res.render('list_users', { users });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

const getUserHandler = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.redirect('/login');
        }

        // Get user data
        const user = await getUserById(userId);
        if (!user) {
            return res.redirect('/login');
        }

        // Get user's answers with questions
        const answers = await getAllAnswersByUserId(userId);

        // Format user data with defaults
        const userData = {
            _id: user._id,
            username: user.username || 'Anonymous',
            email: user.email || '',
            bio: user.bio || '',
            profilePicture: user.profilePicture || null,
            createdAt: user.createdAt || new Date()
        };

        // Render profile with all data
        res.render('users/profile', {
            user: userData,
            answers: answers || [], // answers now include question details from getAllAnswersByUserId
            userId: req.session.userId,
            error: null,
            success: null
        });

    } catch (err) {
        console.error('Error:', err);
        res.redirect('/login');
    }
};

const getUserByIdHandler = async (req, res) => {
    try {
        const user = await getUserById(req.params.id);
        if (!user) {
            return res.redirect('/questions');
        }
        res.render('users/profile', { 
            user,
            userId: req.session.userId,
            isOwnProfile: req.session.userId === req.params.id
        });
    } catch (err) {
        console.error(err);
        res.redirect('/questions');
    }
};

const updateUserHandler = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { username, email, bio } = req.body;

        let updateData = { username, email, bio };

        if (req.file) {
            updateData.profilePicture = '/uploads/profile_pics/' + req.file.filename;
        }

        await updateUserById(userId, updateData);
        
        // Redirect back to profile page
        res.redirect('/users/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

const addUserHandler = async (req, res) => {
    const userData = req.body;
    try {
        await insertUser(userData);  
        res.status(200).json({ message: "User added successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding user" });
    }
};

const deleteUserHandler = async (req, res) => {
    try {
        await deleteUser(req.params.id);
        res.json({ message: "User deleted successfully "});
    } catch(err) {
        console.log(err);
        res.status(500).send('Internal server error');
    }
};

const changePasswordHandler = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            const user = await getUserById(userId);
            const answers = await getAllAnswersByUserId(userId);
            return res.render('users/profile', {
                user,
                answers,
                userId,
                error: 'Passwords do not match',
                success: null
            });
        }

        await changePassword(userId, newPassword);
        res.redirect('/users/profile');

    } catch (err) {
        console.error('Error changing password:', err);
        res.redirect('/users/profile');
    }
};

module.exports = {
    getAllUsersHandler,
    getUserHandler,
    getUserByIdHandler,
    addUserHandler,
    updateUserHandler,
    deleteUserHandler,
    upload,
    changePasswordHandler
};
