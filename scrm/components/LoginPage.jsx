import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../helpers/context/AuthContext.jsx';
import Navbar from './Navbar';
import Footer from './Footer';

const loginSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required')
});

const LoginPage = () => {
  const { login, loading } = useAuth();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const success = await login(values);
      if (success) {
        navigate('/questions');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-dark">
      <Navbar />
      
      <div className="container py-5 flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="row w-100 justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card bg-dark border-secondary shadow">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h2 className="gradient-text mb-2">Welcome Back</h2>
                  <p className="text-white">Sign in to your account to continue</p>
                </div>
                
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                
                <Formik
                  initialValues={{ username: '', password: '' }}
                  validationSchema={loginSchema}
                  onSubmit={handleSubmit}
                >
                  {({ isSubmitting, errors, touched }) => (
                    <Form>
                      <div className="mb-4">
                        <label htmlFor="username" className="form-label text-white fw-bold">
                          Username
                        </label>
                        <Field
                          type="text"
                          id="username"
                          name="username"
                          className={`form-control bg-dark text-white border-secondary ${
                            errors.username && touched.username ? 'is-invalid' : ''
                          }`}
                          placeholder="Enter your username"
                        />
                        <ErrorMessage 
                          name="username" 
                          component="div" 
                          className="invalid-feedback" 
                        />
                      </div>
                      
                      <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <label htmlFor="password" className="form-label text-white fw-bold">
                            Password
                          </label>
                          <Link to="/forgot-password" className="text-primary small">
                            Forgot Password?
                          </Link>
                        </div>
                        <Field
                          type="password"
                          id="password"
                          name="password"
                          className={`form-control bg-dark text-white border-secondary ${
                            errors.password && touched.password ? 'is-invalid' : ''
                          }`}
                          placeholder="Enter your password"
                        />
                        <ErrorMessage 
                          name="password" 
                          component="div" 
                          className="invalid-feedback" 
                        />
                      </div>
                      
                      <div className="d-grid">
                        <button
                          type="submit"
                          className="btn btn-primary btn-lg"
                          disabled={isSubmitting || loading}
                        >
                          {isSubmitting || loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Signing in...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-sign-in-alt me-2"></i>
                              Sign In
                            </>
                          )}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
                
                <div className="mt-4 text-center">
                  <p className="text-white mb-0">
                    Don't have an account? <Link to="/register" className="text-primary">Create one</Link>
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

export default LoginPage; 