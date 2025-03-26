const { MongoClient, ObjectId } = require("mongodb");

let client = null;
let collectionUsers = null;
let collectionQuestions = null;
let collectionAnswers = null;


// function to connect to db and get collection object
async function initDBIfNecessary() {
    if (!client) {
        // only connect to database if not already connected
        client = await MongoClient.connect("mongodb://localhost:27017");

        const db = client.db("overflow");
        collectionUsers = db.collection("users");
        collectionAnswers = db.collection("answers");
        collectionQuestions = db.collection("questions");
    }
} //end function

// function to disconnect from database
async function disconnect() {
    if (client) {
        await client.close();
        client = null;
    }
} // end disconnect

async function insertUser(user) {
    console.log(user);
    await initDBIfNecessary();
    user.created = new Date();
    const result = await collectionUsers.insertOne(user);
    user._id = result.insertedId.toString();
    return user;
}

async function getAllUsers() {
    await initDBIfNecessary();
    return collectionUsers.find().toArray();
} 

async function getUserById(userId) {
    await initDBIfNecessary();
    try {
        console.log('Getting user with ID:', userId);
        // Check if userId is already an ObjectId
        const id = userId instanceof ObjectId ? userId : ObjectId.createFromHexString(userId);
        const user = await collectionUsers.findOne({ _id: id });
        console.log('User found:', user);
        return user;
    } catch (error) {
        console.error('Error in getUserById:', error);
        return null;
    }
}

async function updateUserById (userId, updateData) {
    try {
        const result = await collectionUsers.updateOne(
            { _id: ObjectId.createFromHexString(userId) },
            { $set: updateData }
        );
        return result;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

async function getUserByUsername(username) {
    await initDBIfNecessary();
    return collectionUsers.findOne({
    username: username,
    });
} 

const updateUser = async (userId, { username, email, bio, profilePicture }) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(userId, {
            username,
            email,
            bio,
            profilePicture
        }, { new: true });  // Returns the updated user

        return updatedUser;
    } catch (err) {
        console.error("Error updating user:", err);
        throw err;
    }
};

module.exports = { updateUser };


async function deleteUser(userId) {
    await initDBIfNecessary();
    try {
        const result = await collectionUsers.deleteOne({
            _id: ObjectId.createFromHexString(userId)
        });
        console.log('Delete user result:', result);
        if (result.deletedCount === 0) {
            throw new Error('User not found or not deleted');
        }
        return result;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

async function postQuestion(userId, question) {
    await initDBIfNecessary();
    // Convert userId to ObjectId if it's not already
    question.userId = userId instanceof ObjectId ? userId : ObjectId.createFromHexString(userId);
    question.createdAt = new Date();
    const result = await collectionQuestions.insertOne(question);
    return result.insertedId.toString();
}
  
async function getQuestions() {
    await initDBIfNecessary();
    return collectionQuestions.find().toArray();
}

async function getQuestionById(questionId) {
    await initDBIfNecessary();
    return collectionQuestions.findOne({
        _id: ObjectId.createFromHexString(questionId)
    });
}




async function postAnswer(answerData) {
    await initDBIfNecessary();
    try {
        const result = await collectionAnswers.insertOne({
            ...answerData,
            createdAt: new Date(),
            upvotes: [],
            downvotes: []
        });
        return result.insertedId;
    } catch (error) {
        console.error('Error posting answer:', error);
        throw error;
    }
}

async function getAnswers(questionId) {
    await initDBIfNecessary();
    try {
        return await collectionAnswers.find({
            questionId: ObjectId.createFromHexString(questionId)
        }).toArray();
    } catch (error) {
        console.error('Error getting answers:', error);
        throw error;
    }
}

async function getAnswerById(answerId) {
    await initDBIfNecessary();
    try {
        return await collectionAnswers.findOne({
            _id: ObjectId.createFromHexString(answerId)
        });
    } catch (error) {
        console.error('Error getting answer:', error);
        throw error;
    }
}

async function updateAnswer(answerId, updateData) {
    await initDBIfNecessary();
    try {
        const result = await collectionAnswers.updateOne(
            { _id: ObjectId.createFromHexString(answerId) },
            { $set: updateData }
        );
        return result.modifiedCount > 0;
    } catch (error) {
        console.error('Error updating answer:', error);
        throw error;
    }
}

async function deleteAnswer(answerId) {
    await initDBIfNecessary();
    try {
        await collectionAnswers.deleteOne({
            _id: ObjectId.createFromHexString(answerId)
        });
    } catch (error) {
        console.error('Error deleting answer:', error);
        throw error;
    }
}

async function toggleVote(collection, itemId, userId, voteType) {
    await initDBIfNecessary();
    const objectId = ObjectId.createFromHexString(itemId);
    const userObjectId = ObjectId.createFromHexString(userId);
    const oppositeVoteType = voteType === "upvotes" ? "downvotes" : "upvotes";

    const item = await collection.findOne({ _id: objectId });
    if (!item) return false;

    const hasVoted = item[voteType] && item[voteType].some(id => id.toString() === userObjectId.toString());
    const hasOppositeVoted = item[oppositeVoteType] && item[oppositeVoteType].some(id => id.toString() === userObjectId.toString());

    let updateQuery = {};

    if (hasVoted) {
        // If already voted this way, remove the vote
        updateQuery = {
            $pull: { [voteType]: userObjectId }
        };
    } else {
        // Add new vote and remove opposite vote if it exists
        updateQuery = {
            $addToSet: { [voteType]: userObjectId }
        };
        if (hasOppositeVoted) {
            updateQuery.$pull = { [oppositeVoteType]: userObjectId };
        }
    }

    await collection.updateOne({ _id: objectId }, updateQuery);
    return true;
}

async function upvoteQuestion(userId, questionId) {
    return toggleVote(collectionQuestions, questionId, userId, "upvotes");
}

async function downvoteQuestion(userId, questionId) {
    return toggleVote(collectionQuestions, questionId, userId, "downvotes");
}

async function upvoteAnswer(userId, answerId) {
    return toggleVote(collectionAnswers, answerId, userId, "upvotes");
}

async function downvoteAnswer(userId, answerId) {
    return toggleVote(collectionAnswers, answerId, userId, "downvotes");
}

async function deleteQuestion(questionId) {
    await initDBIfNecessary();
    try {
        await collectionQuestions.deleteOne({
            _id: ObjectId.createFromHexString(questionId)
        });
        // Optionally delete associated answers
        await collectionAnswers.deleteMany({
            questionId: ObjectId.createFromHexString(questionId)
        });
    } catch (error) {
        console.error('Error deleting question:', error);
        throw error;
    }
}

const updateQuestion = async (questionId, updateData) => {
    try {
        await initDBIfNecessary();
        const result = await collectionQuestions.updateOne(
            { _id: ObjectId.createFromHexString(questionId) },
            { $set: updateData }
        );
        return result.modifiedCount > 0;
    } catch (error) {
        console.error('Error updating question:', error);
        throw error;
    }
};

const changePassword = async (userId, newPassword) => {
    try {
        return await collectionUsers.updateOne(
            { _id: ObjectId.createFromHexString(userId) },
            { $set: { password: newPassword } }
        );
    } catch (err) {
        console.error('Error changing password:', err);
        return null;
    }
};

const getAllAnswersByUserId = async (userId) => {
    try {
        return await collectionAnswers
            .find({ userId: new ObjectId(userId) })
            .sort({ createdAt: -1 })
            .toArray();
    } catch (err) {
        console.error('Error getting user answers:', err);
        return [];
    }
};

// export functions so can be used in other files
module.exports = {
    insertUser,
    disconnect,
    getAllUsers,
    deleteUser,
    getUserById,
    updateUserById,
    updateUser,
    getUserByUsername,
    getQuestionById,
    postQuestion,
    getQuestions,
    postAnswer,
    getAnswers,
    getAnswerById,
    updateAnswer,
    deleteAnswer,
    upvoteAnswer,
    downvoteAnswer,
    upvoteQuestion,
    downvoteQuestion,
    deleteQuestion,
    toggleVote,
    updateQuestion,
    changePassword,
    getAllAnswersByUserId
};
