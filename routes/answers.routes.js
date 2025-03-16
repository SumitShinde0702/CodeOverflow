const express = require("express");
const router = express.Router();
const {
    postAnswerHandler,
    editAnswerHandler,
    deleteAnswerHandler,
    upvoteAnswerHandler,
    downvoteAnswerHandler,
    getEditAnswerHandler
} = require("../handlers/answers.handlers");

function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        next(); //continue - pass to the next middleware
    } else {
        //bounce the user to the login page
        res.redirect("/login");
    }
}

// Answer CRUD routes
router.post("/:questionId/answers", requireAuth, postAnswerHandler);
router.get("/:id/edit", requireAuth, getEditAnswerHandler);
router.post("/:id/edit", requireAuth, editAnswerHandler);
router.post("/:id/delete", requireAuth, deleteAnswerHandler);

// Answer voting routes
router.post("/:id/upvote", requireAuth, upvoteAnswerHandler);
router.post("/:id/downvote", requireAuth, downvoteAnswerHandler);

module.exports = router;