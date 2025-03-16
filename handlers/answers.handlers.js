const {
    postAnswer,
    getAnswers,
    getAnswerById,
    updateAnswer,
    deleteAnswer,
    upvoteAnswer,
    downvoteAnswer,
    getUserById
} = require("../lib/database");
const { ObjectId } = require("mongodb");

const postAnswerHandler = async (req, res) => {
    try {
        const questionId = req.params.questionId;
        const userId = req.session.userId;
        const { body } = req.body;

        const user = await getUserById(userId);
        const answerData = {
            body,
            userId: ObjectId.createFromHexString(userId),
            questionId: ObjectId.createFromHexString(questionId),
            authorName: user.username,
            author: {
                profilePicture: user.profilePicture,
                username: user.username
            },
            createdAt: new Date(),
            upvotes: [],
            downvotes: []
        };

        await postAnswer(answerData);
        res.redirect(`/questions/${questionId}`);
    } catch (error) {
        console.error("Error posting answer:", error);
        res.redirect(`/questions/${req.params.questionId}`);
    }
};

const getEditAnswerHandler = async (req, res) => {
    try {
        const answer = await getAnswerById(req.params.id);
        if (!answer || answer.userId.toString() !== req.session.userId.toString()) {
            return res.redirect('/questions');
        }
        res.render('answers/edit', { answer, userId: req.session.userId });
    } catch (error) {
        console.error('Error getting answer:', error);
        res.redirect('/questions');
    }
};

const editAnswerHandler = async (req, res) => {
    try {
        const answerId = req.params.id;
        const userId = req.session.userId;
        const { body } = req.body;

        const answer = await getAnswerById(answerId);
        if (!answer || answer.userId.toString() !== userId.toString()) {
            return res.redirect('/questions');
        }

        await updateAnswer(answerId, { body });
        res.redirect(`/questions/${answer.questionId}`);
    } catch (error) {
        console.error('Error updating answer:', error);
        res.redirect('/questions');
    }
};

const deleteAnswerHandler = async (req, res) => {
    try {
        const answer = await getAnswerById(req.params.id);
        if (!answer || answer.userId.toString() !== req.session.userId.toString()) {
            return res.redirect('/questions');
        }

        await deleteAnswer(req.params.id);
        res.redirect(`/questions/${answer.questionId}`);
    } catch (error) {
        console.error('Error deleting answer:', error);
        res.redirect('/questions');
    }
};

const getAnswersHandler = async (req, res) => {
    try {
        const questionId = req.params.questionId;
        const answers = await getAnswers(questionId);
        res.render('answers', { answers });
    } catch (err) {
        console.error('Error getting answers:', err);
        res.redirect('/questions');
    }
};

const upvoteAnswerHandler = async (req, res) => {
    try {
        const userId = req.session.userId;
        const answerId = req.params.id;

        if (!userId) {
            return res.redirect('/login');
        }

        const answer = await getAnswerById(answerId);
        await upvoteAnswer(userId, answerId);
        
        res.redirect(`/questions/${answer.questionId}`);
    } catch (err) {
        console.error('Error upvoting answer:', err);
        res.redirect('/questions');
    }
};

const downvoteAnswerHandler = async (req, res) => {
    try {
        const userId = req.session.userId;
        const answerId = req.params.id;

        if (!userId) {
            return res.redirect('/login');
        }

        const answer = await getAnswerById(answerId);
        await downvoteAnswer(userId, answerId);
        
        // Redirect back to the question detail page
        res.redirect(`/questions/${answer.questionId}`);
    } catch (err) {
        console.error('Error downvoting answer:', err);
        res.redirect('/questions');
    }
};

module.exports = {
    postAnswerHandler,
    getEditAnswerHandler,
    editAnswerHandler,
    deleteAnswerHandler,
    getAnswersHandler,
    upvoteAnswerHandler,
    downvoteAnswerHandler
}; 