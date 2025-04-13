const express = require("express");
const router = express.Router();
const {
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
} = require("../handlers/questions.handlers");
const { requireAuthJWT } = require("../handlers/users.handlers");

// Questions routes
router.get("/", getQuestionsHandler);
router.post("/", requireAuthJWT, postQuestionHandler);

// Voting routes
router.post("/:id/upvote", requireAuthJWT, upvoteQuestionHandler);
router.post("/:id/downvote", requireAuthJWT, downvoteQuestionHandler);

// Edit routes
router.get("/:id/edit", requireAuthJWT, getEditQuestionHandler);
router.put("/:id", requireAuthJWT, editQuestionHandler);

// Delete route
router.delete("/:id", requireAuthJWT, deleteQuestionHandler);

// Add this route for question details
router.get("/:id", getQuestionDetailHandler);

// Add route to get answers for a question
router.get("/:id/answers", getAnswersHandler);

// Add route to post answers to a question
router.post("/:id/answers", requireAuthJWT, postAnswerHandler);

module.exports = router;