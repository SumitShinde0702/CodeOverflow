const express = require("express");
const router = express.Router();
const { requireAuthJWT } = require("../handlers/users.handlers");
const {
    postAnswerHandler,
    editAnswerHandler,
    deleteAnswerHandler,
    upvoteAnswerHandler,
    downvoteAnswerHandler
} = require("../handlers/answers.handlers");

// Answer CRUD routes
router.post("/:questionId/answers", requireAuthJWT, postAnswerHandler);
router.put("/:id", requireAuthJWT, editAnswerHandler);
router.delete("/:id", requireAuthJWT, deleteAnswerHandler);

// Answer voting routes
router.post("/:id/upvote", requireAuthJWT, upvoteAnswerHandler);
router.post("/:id/downvote", requireAuthJWT, downvoteAnswerHandler);

module.exports = router;