import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from '../helpers/context/AuthContext';
import Api from '../helpers/api';
import Navbar from './Navbar';
import Footer from './Footer';

const UserProfilePage = () => {
  const { id: userId } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // If no userId is provided and user is not authenticated, redirect to home
  if (!userId && !isAuthenticated) {
    return (
      <div className="min-vh-100 d-flex flex-column bg-dark text-light">
        <Navbar />
        <div className="container py-5 flex-grow-1">
          <div className="alert alert-warning" role="alert">
            <h4 className="alert-heading">Authentication Required</h4>
            <p>Please log in to view your profile.</p>
            <hr />
            <Link to="/login" className="btn btn-primary me-2">
              <i className="fas fa-sign-in-alt me-2"></i>Login
            </Link>
            <Link to="/" className="btn btn-secondary">
              <i className="fas fa-home me-2"></i>Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Determine which profile to show
  const isOwnProfile = !userId;
  const profileData = isOwnProfile ? currentUser : null;
  const effectiveUserId = isOwnProfile ? currentUser?._id : userId;

  // Fetch user profile data
  const {
    data: userData,
    isLoading: isLoadingUser,
    error: userError
  } = useQuery({
    queryKey: ['user', effectiveUserId],
    queryFn: () => {
      if (isOwnProfile) {
        return Api.getUserProfile();
      } else if (effectiveUserId) {
        return Api.getUserById(effectiveUserId);
      }
      return Promise.resolve(null);
    },
    enabled: isOwnProfile || !!effectiveUserId,
    initialData: profileData,
    retry: false,
    onError: (error) => {
      console.error('Failed to load profile data:', error);
      toast.error('Failed to load profile data.');
    }
  });

  // Fetch user questions
  const {
    data: userQuestions = [],
    isLoading: isLoadingQuestions,
    error: questionsError
  } = useQuery({
    queryKey: ['userQuestions', effectiveUserId],
    queryFn: () => effectiveUserId ? Api.getUserQuestions(effectiveUserId) : Promise.resolve([]),
    enabled: !!effectiveUserId,
    retry: false,
    onError: () => {
      toast.error('Failed to load questions data.');
    }
  });

  // Fetch user answers
  const {
    data: userAnswers = [],
    isLoading: isLoadingAnswers,
    error: answersError
  } = useQuery({
    queryKey: ['userAnswers', effectiveUserId],
    queryFn: () => effectiveUserId ? Api.getUserAnswers(effectiveUserId) : Promise.resolve([]),
    enabled: !!effectiveUserId,
    retry: false,
    onError: () => {
      toast.error('Failed to load answers data.');
    }
  });

  // Calculate reputation based on user activity
  const calculateReputation = () => {
    if (!userData) return 0;
    
    let reputation = 0;
    
    // Add reputation for questions (upvotes - downvotes)
    userQuestions.forEach(question => {
      reputation += (question.upvotes?.length || 0);
      reputation -= (question.downvotes?.length || 0);
    });
    
    // Add reputation for answers (upvotes - downvotes)
    userAnswers.forEach(answer => {
      reputation += (answer.upvotes?.length || 0);
      reputation -= (answer.downvotes?.length || 0);
    });
    
    return Math.max(0, reputation); // Ensure minimum reputation is 0
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown date';
      
      // Check if we have a valid date string
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Date formatting error';
    }
  };

  // Add this function at the top level of the component
  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return null;
    const filename = profilePicture.split('/').pop();
    return `http://localhost:3000/uploads/${filename}`;
  };

  // Loading and error states
  if (isLoadingUser) {
    return (
      <div className="min-vh-100 d-flex flex-column bg-dark text-light">
        <Navbar />
        <div className="container py-5 flex-grow-1 d-flex justify-content-center align-items-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (userError || !userData) {
    return (
      <div className="min-vh-100 d-flex flex-column bg-dark text-light">
        <Navbar />
        <div className="container py-5 flex-grow-1">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">User not found</h4>
            <p>The user profile you're looking for does not exist or has been removed.</p>
            <hr />
            <Link to="/" className="btn btn-primary">
              <i className="fas fa-home me-2"></i>Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-dark text-light">
      <Navbar />

      <div className="container py-4">
        <div className="row mb-4">
          <div className="col-md-3 mb-4 mb-md-0">
            <div className="card bg-dark border-secondary text-center">
              <div className="card-body">
                <div className="text-center mb-4">
                  <img
                    src={userData.profilePicture ? 
                      `http://localhost:3000/uploads/${userData.profilePicture.split('/').pop()}` : 
                      '/images/default-avatar.png'
                    }
                    alt={`${userData.username}'s profile`}
                    className="profile-image rounded-circle mb-3 shadow-sm"
                    style={{
                      width: '150px',
                      height: '150px',
                      objectFit: 'cover',
                      border: '3px solid #3498db'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default-avatar.png';
                    }}
                  />
                  <h3 className="h4 mb-2 text-light">{userData.username}</h3>
                  <div className="text-info mb-3">
                    Member since {formatDate(userData.created || userData.createdAt)}
                  </div>
                </div>
                <div className="badge bg-primary mb-2">
                  <i className="fas fa-medal me-1"></i> {calculateReputation()} Rep
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div className="card bg-dark border-secondary mt-3">
                <div className="card-body">
                  <h5 className="card-title text-white mb-3">Account Management</h5>
                  <div className="d-grid gap-2">
                    <Link to="/edit-profile" className="btn btn-outline-primary">
                      <i className="fas fa-user-edit me-2"></i>Edit Profile
                    </Link>
                    <Link to="/change-password" className="btn btn-outline-secondary">
                      <i className="fas fa-key me-2"></i>Change Password
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-md-9">
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header bg-dark border-secondary">
                <h5 className="mb-0 text-white">About</h5>
              </div>
              <div className="card-body">
                <h6 className="card-subtitle mb-2 text-white fw-bold">Bio</h6>
                <p className="card-text text-white">{userData?.bio || 'No bio provided'}</p>
                
                <h6 className="card-subtitle mb-2 mt-4 text-white fw-bold">Email</h6>
                <p className="card-text text-white">{userData?.email || 'Email not available'}</p>
                
                <h6 className="card-subtitle mb-2 mt-4 text-white fw-bold">Member since</h6>
                <p className="card-text text-white">{formatDate(userData?.created || new Date())}</p>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header bg-dark border-secondary">
                <h5 className="mb-0 text-white">Activity Stats</h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-4 mb-3 mb-md-0">
                    <h2 className="text-primary">{userQuestions?.length || 0}</h2>
                    <p className="text-white mb-0">Questions</p>
                  </div>
                  <div className="col-md-4 mb-3 mb-md-0">
                    <h2 className="text-primary">{userAnswers?.length || 0}</h2>
                    <p className="text-white mb-0">Answers</p>
                  </div>
                  <div className="col-md-4">
                    <h2 className="text-primary">{userData?.reputation || 0}</h2>
                    <p className="text-white mb-0">Reputation</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header bg-dark border-secondary">
                <ul className="nav nav-tabs card-header-tabs">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'profile' ? 'active bg-primary' : 'text-light'}`}
                      onClick={() => setActiveTab('profile')}
                    >
                      <i className="fas fa-user me-2"></i>Profile
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'questions' ? 'active bg-primary' : 'text-light'}`}
                      onClick={() => setActiveTab('questions')}
                    >
                      <i className="fas fa-question-circle me-2"></i>Questions ({userQuestions.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'answers' ? 'active bg-primary' : 'text-light'}`}
                      onClick={() => setActiveTab('answers')}
                    >
                      <i className="fas fa-comment-alt me-2"></i>Answers ({userAnswers.length})
                    </button>
                  </li>
                </ul>
              </div>
              <div className="card-body">
                {activeTab === 'questions' && (
                  <div>
                    {isLoadingQuestions ? (
                      <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading questions...</span>
                        </div>
                      </div>
                    ) : userQuestions.length === 0 ? (
                      <div className="text-center text-muted py-4">
                        <i className="fas fa-question-circle fa-3x mb-3"></i>
                        <p>No questions asked yet</p>
                      </div>
                    ) : (
                      <div className="list-group bg-dark">
                        {userQuestions.map(question => (
                          <Link
                            key={question._id}
                            to={`/questions/${question._id}`}
                            className="list-group-item list-group-item-action bg-dark text-white border-secondary"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="mb-1">{question.title || 'Untitled Question'}</h6>
                              <small className="text-muted">
                                {formatDate(question.createdAt)}
                              </small>
                            </div>
                            <p className="mb-1 text-secondary">
                              {question.content ? 
                                (question.content.length > 150 ? 
                                  `${question.content.slice(0, 150)}...` : 
                                  question.content
                                ) : 
                                'No content available'
                              }
                            </p>
                            <div className="d-flex gap-3">
                              <small className="text-info">
                                <i className="fas fa-thumbs-up me-1"></i>
                                {question.upvotes?.length || 0}
                              </small>
                              <small className="text-danger">
                                <i className="fas fa-thumbs-down me-1"></i>
                                {question.downvotes?.length || 0}
                              </small>
                              <small className="text-secondary">
                                <i className="fas fa-comment-alt me-1"></i>
                                {question.answers?.length || 0} answers
                              </small>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'answers' && (
                  <div>
                    {isLoadingAnswers ? (
                      <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading answers...</span>
                        </div>
                      </div>
                    ) : userAnswers.length === 0 ? (
                      <div className="text-center text-muted py-4">
                        <i className="fas fa-comment-alt fa-3x mb-3"></i>
                        <p>No answers posted yet</p>
                      </div>
                    ) : (
                      <div className="list-group bg-dark">
                        {userAnswers.map(answer => (
                          <Link
                            key={answer._id}
                            to={`/questions/${answer.questionId}`}
                            className="list-group-item list-group-item-action bg-dark text-white border-secondary"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="mb-1">Answer to: {answer.questionTitle || 'Untitled Question'}</h6>
                              <small className="text-muted">
                                {formatDate(answer.createdAt)}
                              </small>
                            </div>
                            <p className="mb-1 text-secondary">
                              {answer.content ? 
                                (answer.content.length > 150 ? 
                                  `${answer.content.slice(0, 150)}...` : 
                                  answer.content
                                ) : 
                                'No content available'
                              }
                            </p>
                            <div className="d-flex gap-3">
                              <small className="text-info">
                                <i className="fas fa-thumbs-up me-1"></i>
                                {answer.upvotes?.length || 0}
                              </small>
                              <small className="text-danger">
                                <i className="fas fa-thumbs-down me-1"></i>
                                {answer.downvotes?.length || 0}
                              </small>
                              {answer.isAccepted && (
                                <small className="text-success">
                                  <i className="fas fa-check-circle me-1"></i>
                                  Accepted
                                </small>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UserProfilePage;