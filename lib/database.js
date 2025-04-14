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

async function updateUserById(userId, updateData) {
    try {
        await initDBIfNecessary();
        
        // Convert userId to ObjectId if it's not already
        const id = userId instanceof ObjectId ? userId : ObjectId.createFromHexString(userId);
        
        // Remove any undefined or null values from updateData
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined || updateData[key] === null) {
                delete updateData[key];
            }
        });
        
        // Add updatedAt timestamp
        updateData.updatedAt = new Date();
        
        const result = await collectionUsers.findOneAndUpdate(
            { _id: id },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        
        if (!result) {
            throw new Error('User not found or not updated');
        }
        
        return result;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

async function getUserByUsername(username) {
    await initDBIfNecessary();
    return collectionUsers.findOne({
            username: { $regex: new RegExp(`^${username}$`, 'i') }
    });
}

async function deleteUser(userId) {
    await initDBIfNecessary();
    try {
        console.log('[deleteUser] Received userId:', userId);
        console.log('[deleteUser] userId type:', typeof userId);
        
        // Ensure userId is a valid string
        if (!userId || typeof userId !== 'string') {
            console.error('[deleteUser] Invalid userId format - not a string:', userId);
            throw new Error('Invalid user ID format');
        }

        // Convert string to ObjectId safely
        let id;
        try {
            console.log('[deleteUser] Attempting to convert to ObjectId:', userId);
            id = ObjectId.createFromHexString(userId);
            console.log('[deleteUser] Successfully converted to ObjectId:', id.toString());
        } catch (error) {
            console.error('[deleteUser] Error converting userId to ObjectId:', error);
            throw new Error('Invalid user ID format');
        }
        
        console.log('[deleteUser] Attempting to delete user with ObjectId:', id.toString());
        const result = await collectionUsers.deleteOne({
            _id: id
        });
        
        console.log('[deleteUser] Delete operation result:', result);
        
        if (result.deletedCount === 0) {
            console.error('[deleteUser] User not found or not deleted');
            throw new Error('User not found or not deleted');
        }
        
        return result;
    } catch (error) {
        console.error('[deleteUser] Error in deleteUser:', error);
        throw error;
    }
}

async function postQuestion(userId, question) {
    await initDBIfNecessary();
    // Convert userId to ObjectId if it's not already
    question.userId = userId instanceof ObjectId ? userId : ObjectId.createFromHexString(userId);
    question.createdAt = new Date();
    question.upvotes = []; // Initialize empty upvotes array
    question.downvotes = []; // Initialize empty downvotes array
    const result = await collectionQuestions.insertOne(question);
    return result.insertedId.toString();
}
  
async function getQuestions(filter = {}) {
    await initDBIfNecessary();
    let query = {};
    
    // If filter is for unanswered questions
    if (filter.unanswered) {
        // Get all questions
        const allQuestions = await collectionQuestions.find().toArray();
        
        // Get all answers
        const allAnswers = await collectionAnswers.find().toArray();
        
        // Create a set of question IDs that have answers
        const answeredQuestionIds = new Set(
            allAnswers.map(answer => answer.questionId.toString())
        );
        
        // Filter questions that don't have answers
        return allQuestions.filter(question => 
            !answeredQuestionIds.has(question._id.toString())
        );
    }
    
    return collectionQuestions.find(query).toArray();
}

async function getQuestionById(questionId) {
    await initDBIfNecessary();
    try {
        // Check if questionId is already an ObjectId
        const id = questionId instanceof ObjectId ? questionId : ObjectId.createFromHexString(questionId);
        return collectionQuestions.findOne({
            _id: id
        });
    } catch (error) {
        console.error('Error in getQuestionById:', error);
        return null;
    }
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
    try {
        console.log('Toggle vote params:', { collection: collection.collectionName, itemId, userId, voteType });
        
        const objectId = ObjectId.createFromHexString(itemId);
        // Handle both uid and userId formats
        const userObjectId = userId instanceof ObjectId ? userId : ObjectId.createFromHexString(userId);
        const oppositeVoteType = voteType === "upvotes" ? "downvotes" : "upvotes";

        // First, get the current item
        const item = await collection.findOne({ _id: objectId });
        if (!item) {
            console.error('Item not found');
            return false;
        }

        // Initialize arrays if they don't exist
        if (!item[voteType]) item[voteType] = [];
        if (!item[oppositeVoteType]) item[oppositeVoteType] = [];

        // Check if user has already voted
        const hasVoted = item[voteType].some(id => id.toString() === userObjectId.toString());
        const hasOppositeVoted = item[oppositeVoteType].some(id => id.toString() === userObjectId.toString());

        console.log('Current vote state:', {
            hasVoted,
            hasOppositeVoted,
            currentVotes: item[voteType],
            oppositeVotes: item[oppositeVoteType]
        });

        let updateQuery = {};

        if (hasVoted) {
            // If already voted this way, remove the vote
            updateQuery = {
                $pull: { [voteType]: userObjectId }
            };
            console.log('Removing vote');
        } else {
            // Add new vote and remove opposite vote if it exists
            updateQuery = {
                $addToSet: { [voteType]: userObjectId }
            };
            if (hasOppositeVoted) {
                updateQuery.$pull = { [oppositeVoteType]: userObjectId };
            }
            console.log('Adding vote');
        }

        console.log('Update query:', updateQuery);

        const result = await collection.updateOne(
            { _id: objectId },
            updateQuery
        );

        console.log('Update result:', result);

        // Get updated item
        const updatedItem = await collection.findOne({ _id: objectId });
        console.log('Updated item votes:', {
            upvotes: updatedItem.upvotes?.length || 0,
            downvotes: updatedItem.downvotes?.length || 0
        });

        return true;
    } catch (error) {
        console.error('Error in toggleVote:', error);
        throw error;
    }
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
        const id = questionId instanceof ObjectId ? questionId : ObjectId.createFromHexString(questionId);
        const result = await collectionQuestions.deleteOne({
            _id: id
        });
        
        if (result.deletedCount === 0) {
            throw new Error('Question not found');
        }
        
        // Delete associated answers
        await collectionAnswers.deleteMany({
            questionId: id
        });
        
        return result;
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
        await initDBIfNecessary();
        console.log('Changing password for user:', userId);
        
        const result = await collectionUsers.updateOne(
            { _id: ObjectId.createFromHexString(userId) },
            { $set: { password: newPassword } }
        );
        
        console.log('Password change result:', result);
        return result;
    } catch (err) {
        console.error('Error changing password:', err);
        throw err;
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
