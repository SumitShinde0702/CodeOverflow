import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from '../helpers/context/AuthContext';
import Api from '../helpers/api';
import Navbar from './Navbar';
import Footer from './Footer';

const QuestionCard = ({ question, onVote, onDelete, currentUser }) => (
  <div className="card bg-dark text-white mb-3">
    <div className="card-body">
      <div className="d-flex">
        {/* Vote controls */}
        <div className="me-3 text-center">
          <button 
            className="btn btn-outline-light d-block mb-2"
            onClick={() => onVote(question._id, 'upvote')}
            disabled={!currentUser}
            title={!currentUser ? "Please login to vote" : ""}
          >
            <i className={`fas fa-chevron-up ${question.upvotes?.includes(currentUser?._id) ? 'text-primary' : 'text-white'}`}></i>
          </button>
          <div className="text-white mb-2">
            {(question.upvotes?.length || 0) - (question.downvotes?.length || 0)}
          </div>
          <button 
            className="btn btn-outline-light d-block"
            onClick={() => onVote(question._id, 'downvote')}
            disabled={!currentUser}
            title={!currentUser ? "Please login to vote" : ""}
          >
            <i className={`fas fa-chevron-down ${question.downvotes?.includes(currentUser?._id) ? 'text-danger' : 'text-white'}`}></i>
          </button>
        </div>

        {/* Question content */}
        <div className="flex-grow-1">
          <Link to={`/questions/${question._id}`} className="text-decoration-none">
            <h5 className="card-title text-white mb-2 hover-text-primary">{question.title}</h5>
          </Link>
          <p className="card-text text-light mb-2" style={{ whiteSpace: 'pre-line' }}>
            {question.body.length > 200 ? `${question.body.substring(0, 200)}...` : question.body}
          </p>
          
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              {question.tags?.map(tag => (
                <span key={tag} className="badge bg-primary me-1">{tag}</span>
              ))}
            </div>
            <div className="text-light small">
              <span className="me-3">
                <i className="fas fa-comment-alt me-1"></i>
                {question.answerCount || 0} answers
              </span>
              <span>
                Asked by <span className="text-info">{question.author?.username || 'Unknown User'}</span>
                <span className="mx-2 text-light">•</span>
                {new Date(question.createdAt).toLocaleDateString()}
              </span>
              {currentUser && question.userId === currentUser._id && (
                <button
                  className="btn btn-outline-danger btn-sm ms-3"
                  onClick={() => onDelete(question._id)}
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const QuestionsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryClient = useQueryClient();

  // Get filter/sort parameters from URL or use defaults
  const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');
  const [sortBy, setSortBy] = useState(queryParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(parseInt(queryParams.get('page')) || 1);
  const [selectedTag, setSelectedTag] = useState(queryParams.get('tag') || '');

  const questionsPerPage = 10;

  // Fetch questions
  const { data, isLoading, error } = useQuery({
    queryKey: ['questions'],
    queryFn: Api.getQuestions,
    retry: false
  });

  // Ensure questions is an array
  const questionsArray = Array.isArray(data?.questions) ? data.questions : [];
  const allTags = Array.isArray(data?.allTags) ? data.allTags : [];

  // Handle voting
  const handleVote = async (type, id) => {
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      return;
    }
    
    try {
      if (type === 'upvote') {
        await Api.upvoteQuestion(id);
      } else {
        await Api.downvoteQuestion(id);
      }
      queryClient.invalidateQueries(['questions']);
    } catch (error) {
      toast.error(error.message || 'Failed to vote');
    }
  };

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: (id) => Api.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions']);
      toast.success('Question deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting question:', error);
      if (error.message.includes('401')) {
        toast.error('Please login again');
        navigate('/login');
      } else {
        toast.error(error.message || 'Failed to delete question');
      }
    }
  });

  const handleDeleteQuestion = async (id) => {
    if (!isAuthenticated) {
      toast.error('Please login to delete this question');
      return;
    }

    if (window.confirm('Are you sure you want to delete this question? This cannot be undone.')) {
      try {
        await deleteQuestionMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  // Filter and sort questions
  const filteredAndSortedQuestions = questionsArray
    .filter(question => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        question.title?.toLowerCase().includes(searchLower) ||
        question.body?.toLowerCase().includes(searchLower) ||
        question.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        question.author?.username.toLowerCase().includes(searchLower)
      );
      
      // Add tag filtering
      const matchesTag = selectedTag ? question.tags?.includes(selectedTag) : true;
      
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'mostAnswers':
          return (b.answerCount || 0) - (a.answerCount || 0);
        case 'mostVotes':
          return ((b.upvotes?.length || 0) - (b.downvotes?.length || 0)) - 
                 ((a.upvotes?.length || 0) - (a.downvotes?.length || 0));
        default: // 'newest'
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  // Calculate statistics from the questions data
  const totalQuestions = questionsArray.length;
  const totalAnswers = questionsArray.reduce((sum, q) => sum + (Array.isArray(q.answers) ? q.answers.length : 0), 0);
  const uniqueUsers = new Set(questionsArray.map(q => q.userId)).size;

  const totalPages = Math.ceil(filteredAndSortedQuestions.length / questionsPerPage);

  // Update URL when filters change
  const updateURL = () => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (selectedTag) params.set('tag', selectedTag);
    
    navigate({ search: params.toString() });
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    updateURL();
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1); // Reset to first page on sort change
    setTimeout(updateURL, 0);
  };

  // Handle tag selection
  const handleTagClick = (tag) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
    setCurrentPage(1);
    setTimeout(updateURL, 0);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setTimeout(updateURL, 0);
    window.scrollTo(0, 0);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (error) {
    return (
      <div className="min-vh-100 bg-dark">
        <Navbar />
        <div className="container py-4">
          <div className="alert alert-danger">
            Error loading questions. Please try again later.
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-dark">
      <Navbar />
      <div className="container py-4">
        {/* Header section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="text-white">All Questions</h1>
          {isAuthenticated && (
            <Link to="/ask" className="btn btn-primary">
              <i className="fas fa-plus-circle me-2"></i>
              Ask Question
            </Link>
          )}
        </div>

        {/* Search and filter section */}
        <div className="row mb-4">
          <div className="col-md-8">
            <div className="input-group">
              <span className="input-group-text bg-dark text-white border-secondary">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4">
            <select
              className="form-select bg-dark text-white border-secondary"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="newest" className="text-white">Newest</option>
              <option value="oldest" className="text-white">Oldest</option>
              <option value="mostAnswers" className="text-white">Most Answers</option>
              <option value="mostVotes" className="text-white">Most Votes</option>
            </select>
          </div>
        </div>

        {/* Tag filter section */}
        <div className="mb-4">
          <h5 className="text-white mb-3">Filter by Tags</h5>
          <div className="d-flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`btn btn-sm ${selectedTag === tag ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))}
            {selectedTag && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => handleTagClick('')}
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Questions list */}
        {isLoading ? (
          <div className="text-center text-white py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : filteredAndSortedQuestions.length === 0 ? (
          <div className="text-center text-white py-5">
            <i className="fas fa-search fa-3x mb-3"></i>
            <h4>No questions found</h4>
            <p>Try adjusting your search criteria</p>
            {isAuthenticated && (
              <Link to="/ask" className="btn btn-primary">
                <i className="fas fa-plus-circle me-2"></i>
                Ask the First Question
              </Link>
            )}
          </div>
        ) : (
      <div className="questions-list">
            {filteredAndSortedQuestions.map(question => (
              <QuestionCard
                key={question._id}
                question={question}
                onVote={(id, type) => handleVote(type, id)}
                onDelete={handleDeleteQuestion}
                currentUser={user}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default QuestionsPage;