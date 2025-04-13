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
        const userId = req.user.uid;
        const { body } = req.body;

        if (!body) {
            return res.status(400).json({ message: 'Answer content is required' });
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
        const userId = req.user.uid;
        const { body } = req.body;

        // Check if the answer exists and belongs to the user
        const answer = await getAnswerById(answerId);
        if (!answer) {
            return res.status(404).json({ message: 'Answer not found' });
        }
        
        if (answer.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to edit this answer' });
        }

        const updated = await updateAnswer(answerId, { body });
        if (updated) {
            res.json({ message: 'Answer updated successfully' });
        } else {
            res.status(500).json({ message: 'Failed to update answer' });
        }
    } catch (error) {
        console.error("Error editing answer:", error);
        res.status(500).json({ message: "Failed to edit answer" });
    }
};

const deleteAnswerHandler = async (req, res) => {
    try {
        const answerId = req.params.id;
        const userId = req.user.uid;

        // Check if the answer exists and belongs to the user
        const answer = await getAnswerById(answerId);
        if (!answer) {
            return res.status(404).json({ message: 'Answer not found' });
        }
        
        if (answer.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this answer' });
        }

        await deleteAnswer(answerId);
        res.json({ message: 'Answer deleted successfully' });
    } catch (error) {
        console.error("Error deleting answer:", error);
        res.status(500).json({ message: "Failed to delete answer" });
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
        const answerId = req.params.id;
        const userId = req.user.uid;

        const result = await upvoteAnswer(userId, answerId);
        if (result) {
            res.json({ message: 'Answer upvoted successfully' });
        } else {
            res.status(404).json({ message: 'Answer not found' });
        }
    } catch (error) {
        console.error("Error upvoting answer:", error);
        res.status(500).json({ message: "Failed to upvote answer" });
    }
};

const downvoteAnswerHandler = async (req, res) => {
    try {
        const answerId = req.params.id;
        const userId = req.user.uid;

        const result = await downvoteAnswer(userId, answerId);
        if (result) {
            res.json({ message: 'Answer downvoted successfully' });
        } else {
            res.status(404).json({ message: 'Answer not found' });
        }
    } catch (error) {
        console.error("Error downvoting answer:", error);
        res.status(500).json({ message: "Failed to downvote answer" });
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