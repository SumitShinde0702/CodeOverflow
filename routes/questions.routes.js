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
    getQuestionDetailHandler
} = require("../handlers/questions.handlers");

function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.redirect("/login");
    }
}

// Questions routes
router.get("/", getQuestionsHandler);
router.post("/", postQuestionHandler);

// Voting routes
router.post("/:id/upvote", requireAuth, upvoteQuestionHandler);
router.post("/:id/downvote", requireAuth, downvoteQuestionHandler);

// Edit routes
router.get("/:id/edit", requireAuth, getEditQuestionHandler);
router.post("/:id/edit", requireAuth, editQuestionHandler);

// Delete route
router.post("/:id/delete", requireAuth, deleteQuestionHandler);

// Add this route for question details
router.get("/:id", getQuestionDetailHandler);

module.exports = router;