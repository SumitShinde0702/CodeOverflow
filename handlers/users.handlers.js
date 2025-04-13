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
    getQuestions,
    deleteAnswer,
    deleteQuestion,
    getAnswers,
    updateQuestion,
    updateAnswer
} = require("../lib/database");
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const JWT_SECRET = "afanifioeosnefnwir3in23in2";

const loginHandler = async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await getUserByUsername(username);

    if(foundUser && foundUser.password === password) {
        const userDetails = { uid: foundUser._id.toString() }
        const token = jwt.sign(userDetails, JWT_SECRET, { expiresIn: '12h' });
        
        // Send both token and user data
        res.json({
            token,
            user: {
                _id: foundUser._id,
                username: foundUser.username,
                email: foundUser.email,
                profilePicture: foundUser.profilePicture
            }
        });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
}

const requireAuthJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if(!err) {
                req.user = user;
                next();
            } else {
                console.error('JWT verification error:', err);
                res.status(401).json({ message: 'Invalid or expired token' });
            }
        });
    } else {
        res.status(401).json({ message: 'No authorization token provided' });
    }
}

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

        // Get answers and questions count for each user
        const usersWithStats = await Promise.all(sortedUsers.map(async (user) => {
            try {
                const answers = await getAllAnswersByUserId(user._id.toString());
                const allQuestions = await getQuestions();
                const questions = allQuestions.filter(q => q.userId.toString() === user._id.toString());

                // Calculate reputation based on questions and answers
                const reputation = questions.reduce((acc, q) => acc + (q.upvotes?.length || 0) - (q.downvotes?.length || 0), 0) +
                                 answers.reduce((acc, a) => acc + (a.upvotes?.length || 0) - (a.downvotes?.length || 0), 0);

                return {
                    _id: user._id,
                    username: user.username,
                    profilePicture: user.profilePicture,
                    created: user.created || user.createdAt,
                    reputation,
                    totalAnswers: answers.length,
                    totalQuestions: questions.length
                };
            } catch (err) {
                console.error(`Error getting stats for user ${user._id}:`, err);
                return {
                    _id: user._id,
                    username: user.username,
                    profilePicture: user.profilePicture,
                    created: user.created || user.createdAt,
                    reputation: 0,
                    totalAnswers: 0,
                    totalQuestions: 0
                };
            }
        }));

        // Apply sorting for top contributors
        if (sort === 'top') {
            usersWithStats.sort((a, b) => b.reputation - a.reputation);
        }

        res.json(usersWithStats);
    } catch (err) {
        console.error('Error in getAllUsersHandler:', err);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

const getUserHandler = async (req, res) => {
    try {
        const userId = req.user.uid;
        console.log('Fetching user profile for ID:', userId);
        
        if (!userId || typeof userId !== 'string') {
            console.error('Invalid userId format:', userId);
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        const user = await getUserById(userId);
        
        if (!user) {
            console.error('User not found for ID:', userId);
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Format the response to include only necessary fields
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            bio: user.bio || '',
            profilePicture: user.profilePicture,
            created: user.created || user.createdAt || new Date(),
        };
        
        console.log('User data retrieved:', {
            _id: userResponse._id,
            username: userResponse.username,
            email: userResponse.email,
            hasProfilePicture: !!userResponse.profilePicture
        });
        
        res.json(userResponse);
    } catch (error) {
        console.error('Error in getUserHandler:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserByIdHandler = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log('Fetching user details for ID:', userId);
        
        const user = await getUserById(userId);
        
        if (!user) {
            console.error('User not found for ID:', userId);
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Format date fields to ensure they're valid
        const formattedUser = {
            ...user,
            created: user.created || new Date(),
            createdAt: user.createdAt || new Date()
        };
        
        console.log('User data retrieved:', {
            _id: formattedUser._id,
            username: formattedUser.username,
            created: formattedUser.created,
            hasProfilePicture: !!formattedUser.profilePicture
        });
        
        res.json(formattedUser);
    } catch (error) {
        console.error('Error in getUserByIdHandler:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUserHandler = async (req, res) => {
    try {
        const userId = req.user.uid;
        console.log('Updating user profile for ID:', userId);
        
        // Validate userId
        if (!userId || typeof userId !== 'string') {
            console.error('Invalid userId format:', userId);
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        // Verify user exists
        const existingUser = await getUserById(userId);
        if (!existingUser) {
            console.error('User not found for ID:', userId);
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get update data from request
        const updateData = {};
        
        // Only update fields that are provided
        if (req.body.username) updateData.username = req.body.username.trim();
        if (req.body.email) updateData.email = req.body.email.trim();
        if (req.body.bio !== undefined) updateData.bio = req.body.bio.trim();
        
        // Add profile picture if provided
        if (req.file) {
            console.log('Profile picture file received:', req.file);
            updateData.profilePicture = `/uploads/${req.file.filename}`;
        }
        
        console.log('Data prepared for update:', updateData);
        
        // Update user
        const updatedUser = await updateUserById(userId, updateData);
        
        if (!updatedUser) {
            throw new Error('Failed to update user');
        }
        
        // Format the response
        const userResponse = {
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            bio: updatedUser.bio || '',
            profilePicture: updatedUser.profilePicture,
            created: updatedUser.created || updatedUser.createdAt || new Date()
        };
        
        console.log('User updated successfully:', {
            _id: userResponse._id,
            username: userResponse.username,
            hasProfilePicture: !!userResponse.profilePicture
        });
        
        res.json({ 
            message: 'Profile updated successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Error in updateUserHandler:', error);
        res.status(500).json({ message: error.message || 'Failed to update profile' });
    }
};

const addUserHandler = async (req, res) => {
    try {
        // Get fields from request body
        const { username, email, password, bio } = req.body;
        
        console.log('Registration request:', {
            username,
            email,
            hasFile: !!req.file,
            file: req.file
        });

        if (!username || !email || !password) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if user already exists
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Create new user object
        const newUser = {
            username,
            email,
            password,
            bio: bio || '',
            // Store path relative to the static root
            profilePicture: req.file ? `/uploads/${req.file.filename}` : null,
            createdAt: new Date(),
            created: new Date()
        };

        console.log('Creating user with data:', {
            ...newUser,
            password: '[REDACTED]'
        });

        // Insert the user
        const insertedUser = await insertUser(newUser);
        console.log('User created successfully:', {
            _id: insertedUser._id,
            username: insertedUser.username,
            profilePicture: insertedUser.profilePicture
        });
        
        // Return success response
        res.status(201).json({ 
            message: "User registered successfully",
            userId: insertedUser._id
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Error during registration" });
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
        const userId = req.user.uid;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Both old and new passwords are required' });
        }

        // Get the user to verify current password
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        if (user.password !== oldPassword) {
            console.log('Password mismatch:', {
                provided: oldPassword,
                stored: user.password
            });
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        const result = await changePassword(userId, newPassword);
        if (!result || result.modifiedCount === 0) {
            return res.status(500).json({ message: 'Failed to update password' });
        }

        console.log('Password updated successfully for user:', userId);
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error in changePasswordHandler:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteAccountHandler = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        if (!userId) {
            return res.redirect('/login');
        }

        try {
            // Get all user's questions and answers first
            const allQuestions = await getQuestions();
            const userQuestions = allQuestions.filter(q => q.userId.toString() === userId.toString());
            const userAnswers = await getAllAnswersByUserId(userId);

            // 1. Delete all user's questions (this will also delete associated answers)
            for (const question of userQuestions) {
                await deleteQuestion(question._id.toString());
            }

            // 2. Delete any remaining answers by the user on other people's questions
            for (const answer of userAnswers) {
                await deleteAnswer(answer._id.toString());
            }

            // 3. Remove user's votes from remaining questions
            const remainingQuestions = allQuestions.filter(q => q.userId.toString() !== userId.toString());
            for (const question of remainingQuestions) {
                if (question.upvotes || question.downvotes) {
                    await updateQuestion(question._id.toString(), {
                        upvotes: (question.upvotes || []).filter(id => id.toString() !== userId.toString()),
                        downvotes: (question.downvotes || []).filter(id => id.toString() !== userId.toString())
                    });
                }
            }

            // 4. Remove user's votes from remaining answers
            for (const question of remainingQuestions) {
                const questionAnswers = await getAnswers(question._id.toString());
                for (const answer of questionAnswers) {
                    if ((answer.upvotes && answer.upvotes.includes(userId)) || 
                        (answer.downvotes && answer.downvotes.includes(userId))) {
                        await updateAnswer(answer._id.toString(), {
                            upvotes: (answer.upvotes || []).filter(id => id.toString() !== userId.toString()),
                            downvotes: (answer.downvotes || []).filter(id => id.toString() !== userId.toString())
                        });
                    }
                }
            }

            // 5. Finally, delete the user's account
            const deleteResult = await deleteUser(userId);
            console.log('User deletion result:', deleteResult);
            
            // 6. Clear the session and redirect
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                }
                res.redirect('/');
            });
        } catch (deleteError) {
            console.error('Error during deletion process:', deleteError);
            const user = await getUserById(userId);
            const answers = await getAllAnswersByUserId(userId);
            const questions = await getQuestions();
            const userQuestions = questions.filter(q => q.userId.toString() === userId.toString());
            
            return res.render('users/profile', {
                user,
                answers,
                questions: userQuestions,
                userId,
                error: 'Failed to delete account. Please try again.',
                success: null
            });
        }
    } catch (err) {
        console.error('Error in deleteAccountHandler:', err);
        res.redirect('/users/profile');
    }
};

// Handler to get user's questions
const getUserQuestionsHandler = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log('Fetching questions for user ID:', userId);
        
        // Verify the user exists
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get all questions and filter by user ID
        const allQuestions = await getQuestions();
        const userQuestions = allQuestions.filter(q => 
            q.userId && q.userId.toString() === userId
        );
        
        console.log(`Found ${userQuestions.length} questions for user ${userId}`);
        
        // Ensure each question has a valid createdAt
        const formattedQuestions = userQuestions.map(q => ({
            ...q,
            createdAt: q.createdAt || new Date(),
            authorName: user.username
        }));
        
        res.json(formattedQuestions);
    } catch (error) {
        console.error('Error in getUserQuestionsHandler:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add this helper function to check if a string is a valid ObjectId
const isValidObjectId = (id) => {
    if (!id) return false;
    const str = String(id);
    return /^[0-9a-fA-F]{24}$/.test(str);
};

// Handler to get user's answers
const getUserAnswersHandler = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log('Fetching answers for user ID:', userId);
        
        // Verify the user exists
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get all answers for this user
        const userAnswers = await getAllAnswersByUserId(userId) || [];
        
        console.log(`Found ${userAnswers.length} answers for user ${userId}`);
        
        // Enhance answers with question titles
        const enhancedAnswers = await Promise.all(userAnswers.map(async (answer) => {
            try {
                // Default values in case of error
                let questionTitle = 'Unknown Question';
                
                // Only try to fetch the question if the ID is valid
                const questionIdStr = answer.questionId ? answer.questionId.toString() : null;
                
                if (questionIdStr && isValidObjectId(questionIdStr)) {
                    try {
                        const question = await getQuestionById(questionIdStr);
                        if (question && question.title) {
                            questionTitle = question.title;
                        }
                    } catch (questionError) {
                        console.error('Error fetching question:', questionError);
                    }
                } else {
                    console.log('Invalid questionId format:', questionIdStr);
                }
                
                return {
                    ...answer,
                    createdAt: answer.createdAt || new Date(),
                    questionTitle,
                    authorName: user.username
                };
            } catch (err) {
                console.error('Error enhancing answer:', err);
                return {
                    ...answer,
                    createdAt: answer.createdAt || new Date(),
                    questionTitle: 'Unknown Question',
                    authorName: user.username
                };
            }
        }));
        
        res.json(enhancedAnswers);
    } catch (error) {
        console.error('Error in getUserAnswersHandler:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    loginHandler,
    getAllUsersHandler,
    getUserHandler,
    getUserByIdHandler,
    addUserHandler,
    updateUserHandler,
    deleteUserHandler,
    changePasswordHandler,
    deleteAccountHandler,
    requireAuthJWT,
    getUserQuestionsHandler,
    getUserAnswersHandler
};
