import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../helpers/context/AuthContext';
import { toast } from 'react-toastify';
import Api from '../helpers/api';
import Navbar from './Navbar';
import Footer from './Footer';

const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
  bio: Yup.string()
    .max(500, 'Bio must be less than 500 characters')
});

const RegisterPage = () => {
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [profilePreview, setProfilePreview] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append('username', values.username);
      formData.append('email', values.email);
      formData.append('password', values.password);
      formData.append('bio', values.bio || '');
      
      // Log the form data for debugging
      console.log('Registration form data:', {
        username: values.username,
        email: values.email,
        hasProfilePicture: !!values.profilePicture,
        profilePictureSize: values.profilePicture?.size
      });
      
      if (values.profilePicture) {
        if (values.profilePicture.size > 5 * 1024 * 1024) {
          toast.error('Profile picture must be less than 5MB');
          return;
        }
        formData.append('profilePicture', values.profilePicture);
        console.log('Profile picture being uploaded:', {
          name: values.profilePicture.name,
          type: values.profilePicture.type,
          size: values.profilePicture.size
        });
      }

      // Validate required fields
      if (!values.username || !values.email || !values.password) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await Api.register(formData);
      console.log('Registration response:', response);
      
      if (response) {
        toast.success('Registration successful! Please log in.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
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
      
      const reader = new FileReader();
      reader.onload = (e) => setProfilePreview(e.target.result);
      reader.readAsDataURL(file);
      setFieldValue('profilePicture', file);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-dark">
      <Navbar />
      
      <div className="container py-5 flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="row w-100 justify-content-center">
          <div className="col-md-8 col-lg-6">
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError('')}></button>
              </div>
            )}
            {successMessage && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                {successMessage}
                <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
              </div>
            )}
            <div className="card bg-dark border-secondary shadow">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h2 className="gradient-text mb-2">Create Your Account</h2>
                  <p className="text-white">Join our community of developers</p>
                </div>
                
                <Formik
                  initialValues={{
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    bio: '',
                    profilePicture: null
                  }}
                  validationSchema={RegisterSchema}
                  onSubmit={handleSubmit}
                >
                  {({ isSubmitting, errors, touched, setFieldValue }) => (
                    <Form>
                      <div className="row">
                        <div className="col-md-6 mb-4">
                          <label htmlFor="username" className="form-label text-white fw-bold">
                            Username <span className="text-danger">*</span>
                          </label>
                          <Field
                            type="text"
                            id="username"
                            name="username"
                            className={`form-control bg-dark text-white border-secondary ${
                              errors.username && touched.username ? 'is-invalid' : ''
                            }`}
                            placeholder="Choose a username"
                          />
                          <ErrorMessage
                            name="username"
                            component="div"
                            className="invalid-feedback"
                          />
                        </div>
                        
                        <div className="col-md-6 mb-4">
                          <label htmlFor="email" className="form-label text-white fw-bold">
                            Email <span className="text-danger">*</span>
                          </label>
                          <Field
                            type="email"
                            id="email"
                            name="email"
                            className={`form-control bg-dark text-white border-secondary ${
                              errors.email && touched.email ? 'is-invalid' : ''
                            }`}
                            placeholder="Your email address"
                          />
                          <ErrorMessage
                            name="email"
                            component="div"
                            className="invalid-feedback"
                          />
                        </div>
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6 mb-4">
                          <label htmlFor="password" className="form-label text-white fw-bold">
                            Password <span className="text-danger">*</span>
                          </label>
                          <Field
                            type="password"
                            id="password"
                            name="password"
                            className={`form-control bg-dark text-white border-secondary ${
                              errors.password && touched.password ? 'is-invalid' : ''
                            }`}
                            placeholder="Create a password"
                          />
                          <ErrorMessage
                            name="password"
                            component="div"
                            className="invalid-feedback"
                          />
                        </div>
                        
                        <div className="col-md-6 mb-4">
                          <label htmlFor="confirmPassword" className="form-label text-white fw-bold">
                            Confirm Password <span className="text-danger">*</span>
                          </label>
                          <Field
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className={`form-control bg-dark text-white border-secondary ${
                              errors.confirmPassword && touched.confirmPassword ? 'is-invalid' : ''
                            }`}
                            placeholder="Confirm your password"
                          />
                          <ErrorMessage
                            name="confirmPassword"
                            component="div"
                            className="invalid-feedback"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="bio" className="form-label text-white fw-bold">
                          Bio
                        </label>
                        <Field
                          as="textarea"
                          id="bio"
                          name="bio"
                          className="form-control bg-dark text-white border-secondary"
                          placeholder="Tell us about yourself (optional)"
                          rows="3"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <input
                          type="file"
                          className="form-control bg-dark text-white border-secondary"
                          onChange={(e) => handleFileChange(e, setFieldValue)}
                          accept="image/*"
                        />
                        {profilePreview && (
                          <div className="mt-2 text-center">
                            <img
                              src={profilePreview}
                              alt="Profile preview"
                              className="rounded-circle"
                              style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="d-grid mt-4">
                        <button
                          type="submit"
                          className="btn btn-primary btn-lg"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Creating Account...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-user-plus me-2"></i>
                              Create Account
                            </>
                          )}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
                
                <div className="mt-4 text-center">
                  <p className="text-white mb-0">
                    Already have an account? <Link to="/login" className="text-primary">Sign in</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default RegisterPage; 