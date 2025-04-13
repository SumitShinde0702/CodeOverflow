const { 
    postQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    upvoteQuestion,
    downvoteQuestion,
    getUserById,
    getAnswers,
    postAnswer
} = require("../lib/database");
const { ObjectId } = require("mongodb");

const getQuestionsHandler = async (req, res) => {
    try {
        const { sort = 'newest', tag, search } = req.query;
        let questions = await getQuestions();

        // Get all unique tags from questions
        const allTags = [...new Set(questions.flatMap(q => q.tags || []))];

        // Apply filters
        if (tag) {
            questions = questions.filter(q => q.tags && q.tags.includes(tag));
        }
        if (search) {
            questions = questions.filter(q => 
                q.title.toLowerCase().includes(search.toLowerCase()) ||
                q.body.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Apply sorting
        switch(sort) {
            case 'active':
                questions.sort((a, b) => (b.answers?.length || 0) - (a.answers?.length || 0));
                break;
            case 'unanswered':
                questions = questions.filter(q => !q.answers || q.answers.length === 0);
                questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            default:
                questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        const questionsWithAuthors = await Promise.all(questions.map(async (question) => {
            const author = await getUserById(question.userId);
            const answers = await getAnswers(question._id.toString());
            
            return {
                ...question,
                authorName: author ? author.username : 'Unknown User',
                author: {
                    username: author ? author.username : 'Unknown User',
                    profilePicture: author?.profilePicture || null
                },
                answerCount: answers.length,
                // Only set isOwner if user is authenticated
                isOwner: req.user ? (req.user.uid === question.userId.toString()) : false,
                // Convert ObjectId to string for consistent comparison
                userId: question.userId.toString()
            };
        }));

        res.json({
            questions: questionsWithAuthors,
            allTags,
            currentUser: req.user ? { _id: req.user.uid } : null
        });
    } catch (err) {
        console.error('Error getting questions:', err);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
};

const postQuestionHandler = async (req, res) => {
    console.log('Received POST request for question creation');
    try {
        // Get userId from JWT token for API requests
        const userId = req.user ? req.user.uid : req.session.userId;
        const { title, body, tags } = req.body;
        
        console.log('Request body:', req.body);
        
        if (!userId || !title || !body) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        try {
            const user = await getUserById(userId);
            
            const questionData = {
                title,
                body,
                userId,
                authorName: user ? user.username : 'Unknown User',
                createdAt: new Date(),
                upvotes: [],
                downvotes: [],
                tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : [])
            };

            console.log('Question data being saved:', questionData);

            const questionId = await postQuestion(userId, questionData);
            
            // Return JSON for API requests
            return res.status(201).json({ 
                message: 'Question posted successfully',
                _id: questionId
            });
            
        } catch (error) {
            console.error('Error getting user or saving question:', error);
            return res.status(500).json({ message: 'Server error while saving question' });
        }
    } catch (err) {
        console.error('Error in postQuestionHandler:', err);
        res.status(500).json({ message: 'Failed to post question' });
    }
};

const getEditQuestionHandler = async (req, res) => {
    try {
        const question = await getQuestionById(req.params.id);
        if (!question) {
            return res.redirect('/questions');
        }
        res.render('questions/edit', { 
            question,
            userId: req.session.userId 
        });
    } catch (error) {
        console.error('Error getting question:', error);
        res.redirect('/questions');
    }
};

const editQuestionHandler = async (req, res) => {
    try {
        const questionId = req.params.id;
        const userId = req.user.uid;  // Get userId from JWT token
        const { title, body, tags } = req.body;

        const question = await getQuestionById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        if (question.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You can only edit your own questions' });
        }

        const updated = await updateQuestion(questionId, {
            title,
            body,
            tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : [])
        });

        if (updated) {
            const updatedQuestion = await getQuestionById(questionId);
            res.json(updatedQuestion);
        } else {
            res.status(500).json({ message: 'Failed to update question' });
        }
    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ message: 'Failed to update question' });
    }
};

const deleteQuestionHandler = async (req, res) => {
    try {
        const questionId = req.params.id;
        const userId = req.user.uid;  // Get userId from JWT token

        const question = await getQuestionById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        if (question.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You can only delete your own questions' });
        }

        await deleteQuestion(questionId);
        res.status(200).json({ message: 'Question deleted successfully' });
    } catch (err) {
        console.error('Error deleting question:', err);
        res.status(500).json({ message: 'Failed to delete question' });
    }
};

const upvoteQuestionHandler = async (req, res) => {
    try {
        const userId = req.user.uid;  // Get userId from JWT token
        const questionId = req.params.id;

        if (!userId) {
            return res.status(401).json({ message: 'Please login to vote' });
        }

        const result = await upvoteQuestion(userId, questionId);
        if (result) {
            const updatedQuestion = await getQuestionById(questionId);
            res.json(updatedQuestion);
        } else {
            res.status(500).json({ message: 'Failed to upvote question' });
        }
    } catch (err) {
        console.error('Error in upvoteQuestionHandler:', err);
        res.status(500).json({ message: 'Failed to upvote question' });
    }
};

const downvoteQuestionHandler = async (req, res) => {
    try {
        const userId = req.user.uid;  // Get userId from JWT token
        const questionId = req.params.id;

        if (!userId) {
            return res.status(401).json({ message: 'Please login to vote' });
        }

        const result = await downvoteQuestion(userId, questionId);
        if (result) {
            const updatedQuestion = await getQuestionById(questionId);
            res.json(updatedQuestion);
        } else {
            res.status(500).json({ message: 'Failed to downvote question' });
        }
    } catch (err) {
        console.error('Error in downvoteQuestionHandler:', err);
        res.status(500).json({ message: 'Failed to downvote question' });
    }
};

const getQuestionDetailHandler = async (req, res) => {
    try {
        const questionId = req.params.id;
        const question = await getQuestionById(questionId);
        
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        
        // Get author details
        const author = await getUserById(question.userId);
        
        // Format the response
        const formattedQuestion = {
            ...question,
            authorName: author ? author.username : 'Unknown User',
            author: {
                username: author ? author.username : 'Unknown User',
                profilePicture: author?.profilePicture || null
            },
            // Only set isOwner if user is authenticated
            isOwner: req.user ? (req.user.uid === question.userId.toString()) : false,
            // Convert ObjectId to string for consistent comparison
            userId: question.userId.toString()
        };
        
        res.json(formattedQuestion);
    } catch (error) {
        console.error('Error getting question details:', error);
        res.status(500).json({ message: 'Failed to fetch question details' });
    }
};

const getAnswersHandler = async (req, res) => {
    try {
        const questionId = req.params.id;
        const answers = await getAnswers(questionId);
        
        const answersWithAuthors = await Promise.all(answers.map(async (answer) => {
            try {
                const author = await getUserById(answer.userId);
                return {
                    ...answer,
                    authorName: author ? author.username : 'Unknown User',
                    author: {
                        username: author ? author.username : 'Unknown User',
                        profilePicture: author?.profilePicture || null
                    },
                    // Only set isOwner if user is authenticated
                    isOwner: req.user ? (req.user.uid === answer.userId.toString()) : false,
                    // Convert ObjectId to string for consistent comparison
                    userId: answer.userId.toString()
                };
            } catch (error) {
                console.error('Error getting author for answer:', error);
                return {
                    ...answer,
                    authorName: 'Unknown User',
                    author: {
                        username: 'Unknown User',
                        profilePicture: null
                    },
                    isOwner: false,
                    userId: answer.userId.toString()
                };
            }
        }));
        
        res.json({
            answers: answersWithAuthors,
            currentUser: req.user ? { _id: req.user.uid } : null
        });
    } catch (error) {
        console.error('Error fetching answers:', error);
        res.status(500).json({ message: 'Failed to fetch answers' });
    }
};

// Add postAnswerHandler function to handle posting answers to questions
const postAnswerHandler = async (req, res) => {
    try {
        const questionId = req.params.id;
        const userId = req.user.uid;
        const { body } = req.body;

        if (!body) {
            return res.status(400).json({ message: 'Answer content is required' });
        }

        // Verify the question exists
        const question = await getQuestionById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const user = await getUserById(userId);
        const answerData = {
            body,
            userId: ObjectId.createFromHexString(userId),
            questionId: ObjectId.createFromHexString(questionId),
            authorName: user ? user.username : 'Unknown User',
            createdAt: new Date(),
            upvotes: [],
            downvotes: []
        };

        console.log('Creating answer with data:', answerData);
        const newAnswerId = await postAnswer(answerData);
        
        // Return the created answer with its ID
        const createdAnswer = {
            _id: newAnswerId,
            ...answerData,
            author: {
                username: user ? user.username : 'Unknown User',
                profilePicture: user ? user.profilePicture : null
            }
        };
        
        res.status(201).json(createdAnswer);
    } catch (error) {
        console.error("Error posting answer:", error);
        res.status(500).json({ message: "Failed to post answer" });
    }
};

module.exports = {
    getQuestionsHandler,
    postQuestionHandler,
    getEditQuestionHandler,
    editQuestionHandler,
    deleteQuestionHandler,
    upvoteQuestionHandler,
    downvoteQuestionHandler,
    getQuestionDetailHandler,
    getAnswersHandler,
    postAnswerHandler
}; 