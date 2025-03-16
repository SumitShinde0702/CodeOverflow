const { 
    postQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    upvoteQuestion,
    downvoteQuestion,
    getUserById,
    getAnswers
} = require("../lib/database");

const getQuestionsHandler = async (req, res) => {
    try {
        const { sort = 'newest', tag, search } = req.query;
        let questions = await getQuestions();

        // Get all unique tags from questions
        const allTags = [...new Set(questions.flatMap(q => q.tags || []))];

        // Apply tag filter if selected
        if (tag) {
            questions = questions.filter(q => q.tags && q.tags.includes(tag));
        }

        // Apply search filter if present
        if (search) {
            questions = questions.filter(q => 
                q.title.toLowerCase().includes(search.toLowerCase()) ||
                q.body.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Sort questions
        questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const questionsWithAuthors = await Promise.all(questions.map(async (question) => {
            const author = await getUserById(question.userId);
            const answers = await getAnswers(question._id.toString());
            
            console.log('Author data:', author); // Debug log
            console.log('Profile picture path:', author?.profilePicture); // Debug log
            
            return {
                ...question,
                authorName: author ? author.username : 'Unknown User',
                author: {
                    username: author ? author.username : 'Unknown User',
                    profilePicture: author?.profilePicture || null
                },
                answerCount: answers.length,
                isOwner: req.session.userId && question.userId && 
                        req.session.userId.toString() === question.userId.toString()
            };
        }));

        res.render('questions/questions', {
            questions: questionsWithAuthors,
            userId: req.session.userId,
            sort,
            tag: tag || '',
            search: search || '',
            allTags
        });
    } catch (err) {
        console.error('Error getting questions:', err);
        res.render('questions/questions', {
            questions: [],
            userId: req.session.userId,
            sort: 'newest',
            tag: '',
            search: '',
            allTags: []
        });
    }
};

const postQuestionHandler = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { title, body, tags } = req.body;
        const user = await getUserById(userId);

        console.log('User found:', user); // Debug log

        if (!userId || !title || !body) {
            return res.redirect('/questions');
        }

        const questionData = {
            title,
            body,
            userId,
            authorName: user.username,
            createdAt: new Date(),
            upvotes: [],
            downvotes: [],
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        };

        console.log('Question data being saved:', questionData); // Debug log

        await postQuestion(userId, questionData);
        res.redirect('/questions');
    } catch (err) {
        console.error('Error in postQuestionHandler:', err);
        res.redirect('/questions');
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
        const userId = req.session.userId;
        const { title, body, tags } = req.body;

        const question = await getQuestionById(questionId);
        if (!question || question.userId.toString() !== userId.toString()) {
            return res.redirect('/questions');
        }

        await updateQuestion(questionId, {
            title,
            body,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        });

        res.redirect('/questions');
    } catch (error) {
        console.error('Error updating question:', error);
        res.redirect('/questions');
    }
};

const deleteQuestionHandler = async (req, res) => {
    try {
        const questionId = req.params.id;
        const userId = req.session.userId;

        const question = await getQuestionById(questionId);
        if (!question || question.userId.toString() !== userId.toString()) {
            return res.redirect('/questions');
        }

        await deleteQuestion(questionId);
        res.redirect('/questions');
    } catch (err) {
        console.error('Error deleting question:', err);
        res.redirect('/questions');
    }
};

const upvoteQuestionHandler = async (req, res) => {
    try {
        const userId = req.session.userId;
        const questionId = req.params.id;

        if (!userId) {
            return res.redirect('/login');
        }

        await upvoteQuestion(userId, questionId);
        // Check if we're on the detail page
        const referer = req.get('Referer');
        if (referer && referer.includes(`/questions/${questionId}`)) {
            res.redirect(`/questions/${questionId}`);
        } else {
            res.redirect('/questions');
        }
    } catch (err) {
        console.error('Error in upvoteQuestionHandler:', err);
        res.redirect('/questions');
    }
};

const downvoteQuestionHandler = async (req, res) => {
    try {
        const userId = req.session.userId;
        const questionId = req.params.id;

        if (!userId) {
            return res.redirect('/login');
        }

        await downvoteQuestion(userId, questionId);
        // Check if we're on the detail page
        const referer = req.get('Referer');
        if (referer && referer.includes(`/questions/${questionId}`)) {
            res.redirect(`/questions/${questionId}`);
        } else {
            res.redirect('/questions');
        }
    } catch (err) {
        console.error('Error in downvoteQuestionHandler:', err);
        res.redirect('/questions');
    }
};

const getQuestionDetailHandler = async (req, res) => {
    try {
        const questionId = req.params.id;
        const userId = req.session.userId;

        // Get question with author details
        const question = await getQuestionById(questionId);
        console.log('Question found:', question); // Debug log

        if (!question) {
            return res.redirect('/questions');
        }

        // Get the author details
        const author = await getUserById(question.userId);
        console.log('Author found:', author); // Debug log

        const questionWithAuthor = {
            ...question,
            authorName: author ? author.username : 'Unknown User',
            author: {
                profilePicture: author ? author.profilePicture : null
            }
        };

        console.log('Question with author:', questionWithAuthor); // Debug log

        // Get answers for this question
        const answers = await getAnswers(questionId);

        // Get author details for each answer
        const answersWithAuthors = await Promise.all(answers.map(async (answer) => {
            const author = await getUserById(answer.userId);
            return {
                ...answer,
                authorName: author ? author.username : 'Unknown User',
                author: {
                    profilePicture: author ? author.profilePicture : null
                }
            };
        }));

        // Add these debug logs
        console.log("Question author profile picture:", questionWithAuthor.author.profilePicture);
        console.log("Answer profile pictures:", answersWithAuthors.map(a => a.author.profilePicture));

        res.render('questions/question-detail', {
            question: questionWithAuthor,
            answers: answersWithAuthors,
            userId: userId
        });
    } catch (err) {
        console.error('Error in getQuestionDetailHandler:', err);
        res.redirect('/questions');
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
    getQuestionDetailHandler
}; 