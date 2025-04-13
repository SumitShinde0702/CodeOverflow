import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../helpers/context/AuthContext';
import Api from '../helpers/api';
import Navbar from './Navbar';
import Footer from './Footer';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch questions and users
  const { data, isLoading: questionsLoading, error: questionsError } = useQuery({
    queryKey: ['questions'],
    queryFn: Api.getQuestions,
    retry: false // Don't retry on error
  });

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: Api.getUsers,
    retry: false // Don't retry on error
  });

  // Extract questions array and tags from the response
  const questionsArray = data?.questions || [];
  const isLoading = questionsLoading || usersLoading;

  // Calculate statistics
  const totalQuestions = questionsArray.length;
  const totalAnswers = questionsArray.reduce((sum, q) => sum + (q.answerCount || 0), 0);
  const activeUsers = usersData?.length || 0;

  // Filter questions based on search
  const filteredQuestions = questionsArray
    .filter(question => {
      const searchLower = searchTerm.toLowerCase();
      return (
        question.title?.toLowerCase().includes(searchLower) ||
        question.body?.toLowerCase().includes(searchLower) ||
        question.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        question.author?.username.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5); // Only show latest 5 questions

  // Only show error if both queries fail
  if (questionsError && usersError) {
    return (
      <div className="min-vh-100 bg-dark">
        <Navbar />
        <div className="container py-4">
          <div className="alert alert-danger">
            {questionsError?.message || usersError?.message || 'Error loading data. Please try again later.'}
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
        {/* Hero Section */}
        <div className="text-center text-white mb-5">
          <h1 className="display-4 mb-3">Welcome to CodeOverflow</h1>
          <p className="lead mb-4">Your community for coding questions and answers</p>
          {!isAuthenticated && (
            <div className="d-flex justify-content-center gap-3">
              <Link to="/login" className="btn btn-primary btn-lg">
                <i className="fas fa-sign-in-alt me-2"></i>
                Log In
              </Link>
              <Link to="/register" className="btn btn-outline-primary btn-lg">
                <i className="fas fa-user-plus me-2"></i>
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="row mb-5">
          <div className="col-md-4">
            <div className="card bg-dark border-primary text-white mb-3">
              <div className="card-body text-center">
                <i className="fas fa-question-circle fa-3x text-primary mb-3"></i>
                <h2 className="card-title">{isLoading ? '-' : totalQuestions}</h2>
                <p className="card-text">Questions Asked</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-dark border-primary text-white mb-3">
              <div className="card-body text-center">
                <i className="fas fa-comments fa-3x text-primary mb-3"></i>
                <h2 className="card-title">{isLoading ? '-' : totalAnswers}</h2>
                <p className="card-text">Answers Given</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-dark border-primary text-white mb-3">
              <div className="card-body text-center">
                <i className="fas fa-users fa-3x text-primary mb-3"></i>
                <h2 className="card-title">{isLoading ? '-' : activeUsers}</h2>
                <p className="card-text">Active Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Questions Section */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-white mb-0">Recent Questions</h2>
            <Link to="/questions" className="btn btn-primary">
              View All Questions <i className="fas fa-arrow-right ms-2"></i>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="input-group">
              <span className="input-group-text bg-dark text-white border-secondary">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                placeholder="Search recent questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Questions List */}
          {isLoading ? (
            <div className="text-center text-white py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center text-white py-5">
              <i className="fas fa-search fa-3x mb-3"></i>
              <h4>No questions found</h4>
              <p>Try adjusting your search or ask a new question</p>
              {isAuthenticated && (
                <Link to="/ask" className="btn btn-primary">
                  <i className="fas fa-plus-circle me-2"></i>
                  Ask Question
                </Link>
              )}
            </div>
          ) : (
            <div className="questions-list">
              {filteredQuestions.map(question => (
                <div key={question._id} className="card bg-dark text-white border-secondary mb-3">
                  <div className="card-body">
                    <Link to={`/questions/${question._id}`} className="text-decoration-none">
                      <h5 className="card-title text-primary mb-2">{question.title}</h5>
                    </Link>
                    <p className="card-text text-light">{question.body.length > 200 ? `${question.body.substring(0, 200)}...` : question.body}</p>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {question.tags?.map((tag, index) => (
                        <span key={index} className="badge bg-primary">{tag}</span>
                      ))}
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-light">
                        Asked by <span className="text-info">{question.author?.username || 'Unknown User'}</span>
                        <span className="mx-2 text-light">•</span>
                        {new Date(question.createdAt).toLocaleDateString()}
                      </small>
                      <div className="d-flex align-items-center gap-3">
                        <span className="text-light">
                          <i className="fas fa-comment-alt me-1"></i>
                          {question.answerCount || 0} answers
                        </span>
                        <span className="text-light">
                          <i className="fas fa-thumbs-up me-1"></i>
                          {(question.upvotes?.length || 0) - (question.downvotes?.length || 0)} votes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage; 