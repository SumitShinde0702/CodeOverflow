const { 
    insertUser,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUser,
    getUserByUsername,
    getAllAnswersByUserId,
    changePassword,
    getQuestionById,
    getQuestions
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
        const { sort = '', search = '' } = req.query;
        const users = await getAllUsers();
        
        let sortedUsers = [...users];
        
        // Apply search filter if present
        if (search) {
            sortedUsers = sortedUsers.filter(user => 
                user.username.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Apply sorting for top contributors
        if (sort === 'top') {
            // Sort by answer count if that data is available
            sortedUsers.sort((a, b) => (b.answers?.length || 0) - (a.answers?.length || 0));
        }

        // Get answers and questions count for each user
        const usersWithStats = await Promise.all(sortedUsers.map(async (user) => {
            try {
                const answers = await getAllAnswersByUserId(user._id.toString());
                const questions = await getQuestionById(user._id.toString());

                return {
                    ...user,
                    answers,
                    questions
                };
            } catch (err) {
                console.error(`Error getting stats for user ${user._id}:`, err);
                return {
                    ...user,
                    answers: [],
                    questions: []
                };
            }
        }));

        console.log('About to render users page');
        res.render('users/users', {
            users: usersWithStats,
            userId: req.session.userId,
            sort: sort,
            search: search
        });
        console.log('Render completed');
    } catch (err) {
        console.error('Error in getAllUsersHandler:', err);
        res.render('users/users', {
            users: [],
            userId: req.session.userId,
            sort: '',
            search: ''
        });
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
        const answers = await getAllAnswersByUserId(user._id.toString());

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
        console.log('Getting user details for ID:', req.params.id);
        const user = await getUserById(req.params.id);
        
        if (!user) {
            console.log('User not found');
            return res.redirect('/users');
        }

        const answers = await getAllAnswersByUserId(req.params.id) || [];
        const allQuestions = await getQuestions();
        // Filter questions for this user
        const questions = allQuestions.filter(q => q.userId.toString() === req.params.id) || [];

        console.log('Rendering details with:', { 
            username: user.username, 
            answersCount: answers?.length || 0,
            questionsCount: questions?.length || 0
        });
        
        res.render('users/details', {
            user,
            answers: answers || [],
            questions: questions || [],
            userId: req.session.userId
        });
    } catch (err) {
        console.error('Error in getUserByIdHandler:', err);
        res.redirect('/users');
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
            const answers = await getAllAnswersByUserId(user._id.toString());
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
