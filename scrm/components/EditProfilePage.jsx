import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '/helpers/context/AuthContext.jsx';
import Navbar from './Navbar';
import Footer from './Footer';
import { Link } from 'react-router-dom';
import Api from '/helpers/Api';

const profileSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  bio: Yup.string()
    .max(500, 'Bio must be less than 500 characters')
});

const EditProfilePage = () => {
  const { user, updateProfile, isAuthenticated, loading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profilePreview, setProfilePreview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isAuthenticated) {
      toast.info('Please log in to access this page');
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // If still loading, show a loading spinner
  if (loading || !user) {
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

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(''); // Clear any previous errors
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all form fields to FormData
      formData.append('username', values.username.trim());
      formData.append('email', values.email.trim());
      formData.append('bio', (values.bio || '').trim());
      
      // Add profile picture if selected
      if (values.profilePicture instanceof File) {
        // Validate file size
        if (values.profilePicture.size > 5 * 1024 * 1024) { // 5MB
          throw new Error('Profile picture must be less than 5MB');
        }
        formData.append('profilePicture', values.profilePicture);
      }
      
      // Log FormData for debugging
      console.log('Submitting profile update with data:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
      
      const updatedUser = await updateProfile(formData);
      console.log('Profile update response:', updatedUser);
      
      if (!updatedUser) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile updated successfully!');
      
      // Wait for the next tick to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Navigate to profile page without adding to history
      navigate('/', { replace: true });
      navigate('/profile', { replace: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.message || 'Failed to update profile. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Profile picture must be less than 5MB');
        return;
      }
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setProfilePreview(objectUrl);
      setFieldValue('profilePicture', file);
      
      // Clean up object URL when component unmounts
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      await Api.deleteAccount();
      
      // Clear user data and redirect to login
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      toast.success('Account deleted successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return null;
    const filename = profilePicture.split('/').pop();
    return `http://localhost:3000/uploads/${filename}`;
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-dark text-white">
      <Navbar />
      
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card bg-dark border-secondary shadow mb-4">
              <div className="card-header bg-dark border-secondary">
                <h2 className="gradient-text mb-0">Edit Profile</h2>
              </div>
              <div className="card-body p-4">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                ) : (
                  <Formik
                    initialValues={{
                      username: user.username || '',
                      email: user.email || '',
                      bio: user.bio || '',
                      profilePicture: null
                    }}
                    validationSchema={profileSchema}
                    onSubmit={handleSubmit}
                  >
                    {({ isSubmitting, errors, touched, setFieldValue, values }) => (
                      <Form>
                        <div className="row mb-4">
                          <div className="col-md-4 text-center">
                            {/* Profile Image */}
                            <div className="mb-3">
                              {user.profilePicture && (
                                <div className="mb-2">
                                  <small className="text-muted">Debug: {user.profilePicture}</small>
                                </div>
                              )}
                              {profilePreview ? (
                                <img
                                  src={profilePreview}
                                  alt="Profile Preview"
                                  className="img-fluid rounded-circle profile-image border border-secondary"
                                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                />
                              ) : user.profilePicture ? (
                                <img
                                  src={getProfilePictureUrl(user.profilePicture)}
                                  alt="Current profile"
                                  className="img-fluid rounded-circle profile-image border border-secondary"
                                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                  onError={(e) => {
                                    if (!e.target.getAttribute('data-error-handled')) {
                                      console.log('Profile picture load error. URL:', e.target.src);
                                      e.target.setAttribute('data-error-handled', 'true');
                                      e.target.onerror = null;
                                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZiI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgNC44NCAyLjE3IDQuODQgNC44NFMxNC42NyAxNC42OCAxMiAxNC42OHMtNC44NC0yLjE3LTQuODQtNC44NFM5LjMzIDUgMTIgNXptMCAxM2MtMi4zOSAwLTQuNS0xLjM0LTUuNjItMy4zQzcuNDIgMTMuNjIgOS41MSAxMyAxMiAxM3M0LjU4LjYyIDUuNjIgMS43QzE2LjUgMTYuNjYgMTQuMzkgMTggMTIgMTh6Ii8+PC9zdmc+';
                                    }
                                  }}
                                />
                              ) : (
                                <div className="profile-placeholder rounded-circle d-flex align-items-center justify-content-center bg-secondary text-white mb-3 mx-auto" style={{ width: '150px', height: '150px' }}>
                                  <i className="fas fa-user fa-4x"></i>
                                </div>
                              )}
                              <div className="mt-3">
                                <label htmlFor="profilePicture" className="btn btn-outline-primary">
                                  <i className="fas fa-camera me-2"></i>Change Photo
                                </label>
                                <input
                                  type="file"
                                  id="profilePicture"
                                  name="profilePicture"
                                  onChange={(e) => handleFileChange(e, setFieldValue)}
                                  className="d-none"
                                  accept="image/*"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-md-8">
                            {/* Username Field */}
                            <div className="mb-4">
                              <label htmlFor="username" className="form-label fw-bold">
                                Username
                              </label>
                              <Field
                                type="text"
                                id="username"
                                name="username"
                                className={`form-control bg-dark text-white border-secondary ${
                                  errors.username && touched.username ? 'is-invalid' : ''
                                }`}
                              />
                              <ErrorMessage
                                name="username"
                                component="div"
                                className="invalid-feedback"
                              />
                            </div>
                            
                            {/* Email Field */}
                            <div className="mb-4">
                              <label htmlFor="email" className="form-label fw-bold">
                                Email
                              </label>
                              <Field
                                type="email"
                                id="email"
                                name="email"
                                className={`form-control bg-dark text-white border-secondary ${
                                  errors.email && touched.email ? 'is-invalid' : ''
                                }`}
                              />
                              <ErrorMessage
                                name="email"
                                component="div"
                                className="invalid-feedback"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Bio Field */}
                        <div className="mb-4">
                          <label htmlFor="bio" className="form-label fw-bold">
                            Bio
                          </label>
                          <Field
                            as="textarea"
                            id="bio"
                            name="bio"
                            rows="4"
                            className="form-control bg-dark text-white border-secondary"
                            placeholder="Tell us about yourself"
                          />
                        </div>
                        
                        <div className="d-flex justify-content-between">
                          <Link to="/profile" className="btn btn-outline-secondary">
                            <i className="fas fa-arrow-left me-2"></i>Cancel
                          </Link>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Saving...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-save me-2"></i>Save Changes
                              </>
                            )}
                          </button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                )}
              </div>
            </div>
            
            <div className="text-center mt-4">
              <Link to="/change-password" className="btn btn-outline-primary me-2">
                <i className="fas fa-key me-2"></i>Change Password
              </Link>
              <button 
                className="btn btn-outline-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <i className="fas fa-trash-alt me-2"></i>Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-secondary">
              <div className="modal-header bg-dark border-secondary">
                <h5 className="modal-title text-white">Confirm Account Deletion</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="text-white">Are you sure you want to delete your account? This action cannot be undone.</p>
                <p className="text-warning">All your questions, answers, and other data will be permanently removed.</p>
              </div>
              <div className="modal-footer bg-dark border-secondary">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteAccount}>
                  {deletingAccount ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash-alt me-2"></i>Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default EditProfilePage; 