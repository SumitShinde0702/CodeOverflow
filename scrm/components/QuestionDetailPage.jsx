import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../helpers/context/AuthContext';
import Api from '../helpers/api';
import Navbar from './Navbar';
import Footer from './Footer';

const answerSchema = Yup.object().shape({
  body: Yup.string().required('Answer is required')
});

const questionSchema = Yup.object().shape({
  title: Yup.string()
    .min(15, 'Title must be at least 15 characters')
    .required('Title is required'),
  body: Yup.string()
    .min(30, 'Question details must be at least 30 characters')
    .required('Question details are required'),
  tags: Yup.array()
    .min(1, 'At least one tag is required')
    .max(5, 'Maximum 5 tags allowed')
});

const AnswerCard = ({ answer, onVote, onDelete, onEdit, currentUser }) => (
  <div className="card bg-dark text-white mb-3">
    <div className="card-body">
      <div className="d-flex">
        {/* Vote controls */}
        <div className="me-3 text-center">
          <button 
            className="btn btn-outline-light d-block mb-2"
            onClick={() => onVote(answer._id, 'upvote')}
          >
            <i className={`fas fa-chevron-up ${answer.upvotes?.includes(currentUser?._id) ? 'text-primary' : 'text-white'}`}></i>
          </button>
          <div className="text-white mb-2">
            {(answer.upvotes?.length || 0) - (answer.downvotes?.length || 0)}
          </div>
          <button 
            className="btn btn-outline-light d-block"
            onClick={() => onVote(answer._id, 'downvote')}
          >
            <i className={`fas fa-chevron-down ${answer.downvotes?.includes(currentUser?._id) ? 'text-danger' : 'text-white'}`}></i>
          </button>
        </div>

        {/* Answer content */}
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start mb-2">
            {answer.isEditing ? (
              <div className="w-100">
                <textarea
                  className="form-control bg-dark text-white mb-2"
                  value={answer.editContent || answer.body}
                  onChange={(e) => onEdit(answer._id, e.target.value)}
                  rows="4"
                />
                <div>
                  <button 
                    className="btn btn-primary btn-sm me-2"
                    onClick={() => onEdit(answer._id, null, true)}
                  >
                    Save
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEdit(answer._id, null, false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="card-text text-light" style={{ whiteSpace: 'pre-line' }}>
                  {answer.body}
                </div>
                {currentUser?._id === answer.userId && (
                  <div className="ms-3">
                    <button 
                      className="btn btn-outline-primary btn-sm me-2"
                      onClick={() => onEdit(answer._id, answer.body)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => onDelete(answer._id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="text-light small mt-3">
            <span>
              Answered by <span className="text-info">{answer.author?.username || 'Unknown User'}</span>
              <span className="mx-2 text-light">•</span>
              {new Date(answer.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const QuestionDetailPage = () => {
  const { id: questionId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingAnswers, setEditingAnswers] = useState({});
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Fetch question data
  const { data: question, isLoading: isLoadingQuestion } = useQuery({
    queryKey: ['question', questionId],
    queryFn: () => Api.getQuestionById(questionId)
  });

  // Fetch answers
  const { data: answersData } = useQuery({
    queryKey: ['answers', questionId],
    queryFn: () => Api.getAnswers(questionId)
  });

  // Ensure answers is always an array
  const answers = answersData?.answers || [];

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: (data) => Api.updateQuestion(questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['question', questionId]);
      toast.success('Question updated successfully');
      setIsEditingQuestion(false);
    },
    onError: (error) => {
      console.error('Error updating question:', error);
      if (error.message.includes('401')) {
        toast.error('Please login again');
        navigate('/login');
      } else {
        toast.error(error.message || 'Failed to update question');
      }
    }
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: (id) => Api.deleteQuestion(id),
    onSuccess: () => {
      toast.success('Question deleted successfully');
      navigate('/questions');
    },
    onError: (error) => {
      console.error('Error deleting question:', error);
      toast.error(error.message || 'Failed to delete question');
    }
  });

  // Delete answer mutation
  const deleteAnswerMutation = useMutation({
    mutationFn: Api.deleteAnswer,
    onSuccess: () => {
      queryClient.invalidateQueries(['answers', questionId]);
      toast.success('Answer deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting answer:', error);
      toast.error(error.message || 'Failed to delete answer');
    }
  });

  // Edit answer mutation
  const editAnswerMutation = useMutation({
    mutationFn: ({ id, data }) => Api.updateAnswer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['answers', questionId]);
      toast.success('Answer updated successfully');
    },
    onError: (error) => {
      console.error('Error updating answer:', error);
      toast.error(error.message || 'Failed to update answer');
    }
  });

  // Handle voting
  const handleVote = async (type, id, isAnswer = false) => {
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      return;
    }

    try {
      if (isAnswer) {
        await (type === 'upvote' ? Api.upvoteAnswer(id) : Api.downvoteAnswer(id));
      } else {
        await (type === 'upvote' ? Api.upvoteQuestion(id) : Api.downvoteQuestion(id));
      }

      // Invalidate both question and answers queries to ensure everything is up to date
      queryClient.invalidateQueries(['question', questionId]);
      queryClient.invalidateQueries(['answers', questionId]);
      toast.success(`${type === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully`);
    } catch (error) {
      console.error('Vote error:', error);
      if (error.message.includes('401')) {
        toast.error('Please login again');
        navigate('/login');
      } else {
        toast.error(error.message || 'Failed to vote');
      }
    }
  };

  // Post answer mutation
  const postAnswerMutation = useMutation({
    mutationFn: (data) => Api.postAnswer(questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['answers', questionId]);
      toast.success('Answer posted successfully');
    },
    onError: (error) => {
      console.error('Error posting answer:', error);
      if (error.message.includes('401')) {
        toast.error('Please login again');
        navigate('/login');
      } else {
        toast.error(error.message || 'Failed to post answer');
      }
    }
  });

  const handleSubmitAnswer = async (values, { resetForm }) => {
    if (!isAuthenticated) {
      toast.error('Please login to post an answer');
      navigate('/login');
      return;
    }

    try {
      await postAnswerMutation.mutateAsync({
        body: values.body,
        questionId
      });
      resetForm();
    } catch (error) {
      console.error('Error in handleSubmitAnswer:', error);
    }
  };

  const handleEditAnswer = (answerId, content, save = null) => {
    if (save === null) {
      // Start editing
      setEditingAnswers(prev => ({
        ...prev,
        [answerId]: content
      }));
      const updatedAnswers = answers.map(a => 
        a._id === answerId ? { ...a, isEditing: true, editContent: content } : a
      );
      queryClient.setQueryData(['answers', questionId], { answers: updatedAnswers });
    } else if (save) {
      // Save changes
      const content = editingAnswers[answerId];
      if (!content?.trim()) {
        toast.error('Answer cannot be empty');
        return;
      }
      editAnswerMutation.mutate({ 
        id: answerId, 
        data: { body: content }
      });
      setEditingAnswers(prev => {
        const newState = { ...prev };
        delete newState[answerId];
        return newState;
      });
    } else {
      // Cancel editing
      setEditingAnswers(prev => {
        const newState = { ...prev };
        delete newState[answerId];
        return newState;
      });
      const updatedAnswers = answers.map(a => 
        a._id === answerId ? { ...a, isEditing: false, editContent: null } : a
      );
      queryClient.setQueryData(['answers', questionId], { answers: updatedAnswers });
    }
  };

  const handleDeleteQuestion = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to delete this question');
      return;
    }

    if (user._id !== question.userId) {
      toast.error('You can only delete your own questions');
      return;
    }

    if (window.confirm('Are you sure you want to delete this question? This cannot be undone.')) {
      try {
        await deleteQuestionMutation.mutateAsync(questionId);
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!isAuthenticated) {
      toast.error('Please login to delete this answer');
      return;
    }

    const answer = answers.find(a => a._id === answerId);
    if (!answer || user._id !== answer.userId) {
      toast.error('You can only delete your own answers');
      return;
    }

    if (window.confirm('Are you sure you want to delete this answer? This cannot be undone.')) {
      try {
        await deleteAnswerMutation.mutateAsync(answerId);
      } catch (error) {
        console.error('Error deleting answer:', error);
      }
    }
  };

  if (isLoadingQuestion) {
    return (
      <div className="min-vh-100 bg-dark">
        <Navbar />
        <div className="container py-4">
          <div className="text-center text-white">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-vh-100 bg-dark">
        <Navbar />
        <div className="container py-4">
          <div className="text-center text-white">Question not found</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-dark">
      <Navbar />
      <div className="container py-4">
        <div className="card bg-dark text-white">
          <div className="card-body">
            <div className="d-flex">
              {/* Vote controls for question */}
              <div className="me-3 d-flex flex-column align-items-center">
                <button
                  className={`btn btn-link text-decoration-none ${
                    user && question.upvotes?.some(id => id.toString() === user._id.toString()) ? 'text-primary' : 'text-white'
                  }`}
                  onClick={() => handleVote('upvote', questionId)}
                  disabled={!isAuthenticated}
                >
                  <i className="fas fa-chevron-up fa-lg"></i>
                </button>
                <span className="fs-5 fw-bold text-white my-2">
                  {(question.upvotes?.length || 0) - (question.downvotes?.length || 0)}
                </span>
                <button
                  className={`btn btn-link text-decoration-none ${
                    user && question.downvotes?.some(id => id.toString() === user._id.toString()) ? 'text-danger' : 'text-white'
                  }`}
                  onClick={() => handleVote('downvote', questionId)}
                  disabled={!isAuthenticated}
                >
                  <i className="fas fa-chevron-down fa-lg"></i>
                </button>
              </div>

              {/* Question content */}
              <div className="flex-grow-1">
                {isEditingQuestion ? (
                  <Formik
                    initialValues={{
                      title: question.title,
                      body: question.body,
                      tags: question.tags || []
                    }}
                    validationSchema={questionSchema}
                    onSubmit={async (values) => {
                      try {
                        await updateQuestionMutation.mutateAsync({
                          title: values.title.trim(),
                          body: values.body.trim(),
                          tags: values.tags
                        });
                      } catch (error) {
                        console.error('Error updating question:', error);
                      }
                    }}
                  >
                    {({ values, setFieldValue, isSubmitting }) => (
                      <Form>
                        <div className="mb-3">
                          <Field
                            type="text"
                            name="title"
                            className="form-control bg-dark text-white border-secondary"
                            placeholder="Question title"
                          />
                          <ErrorMessage name="title" component="div" className="text-danger" />
                        </div>

                        <div className="mb-3">
                          <Field
                            as="textarea"
                            name="body"
                            className="form-control bg-dark text-white border-secondary"
                            rows="8"
                            placeholder="Question details"
                          />
                          <ErrorMessage name="body" component="div" className="text-danger" />
                        </div>

                        <div className="mb-3">
                          <label htmlFor="tags" className="form-label text-white">Tags</label>
                          <div className="d-flex flex-wrap gap-2 mb-2">
                            {Array.isArray(values.tags) && values.tags.map(tag => (
                              <span key={tag} className="badge bg-primary d-flex align-items-center">
                                {tag}
                                <button
                                  type="button"
                                  className="btn-close btn-close-white ms-2"
                                  onClick={() => {
                                    setFieldValue(
                                      'tags',
                                      values.tags.filter(t => t !== tag)
                                    );
                                  }}
                                  style={{ fontSize: '0.5rem' }}
                                />
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            id="tagInput"
                            className="form-control bg-dark text-white border-secondary"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                const newTag = tagInput.trim().toLowerCase();
                                if (newTag && !values.tags.includes(newTag) && values.tags.length < 5) {
                                  setFieldValue('tags', [...values.tags, newTag]);
                                  setTagInput('');
                                }
                              } else if (e.key === 'Backspace' && !tagInput && values.tags.length > 0) {
                                setFieldValue('tags', values.tags.slice(0, -1));
                              }
                            }}
                            placeholder="Add up to 5 tags (press Enter or comma to add)"
                          />
                          <small className="text-muted">
                            Press Enter or comma to add a tag. Maximum 5 tags.
                          </small>
                          <ErrorMessage name="tags" component="div" className="text-danger mt-1" />
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setIsEditingQuestion(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-start">
                      <h2 className="card-title text-white mb-4">{question.title}</h2>
                      {isAuthenticated && user._id === question.userId && (
                        <div className="btn-group">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setIsEditingQuestion(true)}
                          >
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={handleDeleteQuestion}
                          >
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="card-text mb-4 text-white-50" style={{ whiteSpace: 'pre-wrap' }}>
                      {question.body}
                    </div>
                    <div className="mb-4">
                      {question.tags?.map(tag => (
                        <span key={tag} className="badge bg-secondary me-2">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-info">
                    Asked by {question.authorName} on {new Date(question.createdAt).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answers section */}
        <div className="mt-5">
          <h3 className="text-white mb-4">
            {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
          </h3>
          
          {answers.map(answer => (
            <AnswerCard
              key={answer._id}
              answer={answer}
              onVote={(id, type) => handleVote(type, id, true)}
              onDelete={handleDeleteAnswer}
              onEdit={handleEditAnswer}
              currentUser={user}
            />
          ))}
        </div>

        {/* Post answer form */}
        {isAuthenticated ? (
          <div className="card bg-dark text-white mt-4">
            <div className="card-body">
              <h4 className="card-title">Your Answer</h4>
              <Formik
                initialValues={{ body: '' }}
                validationSchema={answerSchema}
                onSubmit={handleSubmitAnswer}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="mb-3">
                      <Field
                        as="textarea"
                        name="body"
                        className="form-control bg-dark text-white border-secondary"
                        rows="6"
                        placeholder="Write your answer here..."
                      />
                      <ErrorMessage name="body" component="div" className="text-danger" />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Posting...' : 'Post Your Answer'}
                    </button>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        ) : (
          <div className="text-center mt-4">
            <p className="text-white">
              <Link to="/login" className="text-primary">Login</Link> to post an answer
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default QuestionDetailPage; 