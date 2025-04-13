import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../helpers/context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';

const passwordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Please confirm your new password')
});

const ChangePasswordPage = () => {
  const { changePassword, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast.info('Please log in to access this page');
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
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

  const handleSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);
    try {
      // Debug log the actual values
      console.log('Raw form values:', {
        hasCurrentPassword: !!values.currentPassword,
        hasNewPassword: !!values.newPassword,
        hasConfirmPassword: !!values.confirmPassword
      });

      // Validate all fields are filled
      if (!values.currentPassword || !values.newPassword || !values.confirmPassword) {
        toast.error('Please fill in all password fields');
        setIsSubmitting(false);
        return;
      }

      // Validate passwords match
      if (values.newPassword !== values.confirmPassword) {
        toast.error('New passwords do not match');
        setIsSubmitting(false);
        return;
      }

      // Log the data being sent to the API
      console.log('Sending password change request...');

      const success = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });

      if (success) {
        toast.success('Password changed successfully');
        resetForm();
        navigate('/profile');
      } else {
        toast.error('Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-dark text-light">
      <Navbar />
      
      <div className="container py-5">
        <div className="row mb-5">
          <div className="col text-center">
            <h1 className="gradient-text display-4">Change Password</h1>
            <p className="text-gray-300 lead">
              Update your password to keep your account secure
            </p>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-5">
            <div className="card bg-dark border-secondary shadow-sm">
              <div className="card-body p-4">
                <Formik
                  initialValues={{
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  }}
                  validationSchema={passwordSchema}
                  onSubmit={handleSubmit}
                >
                  {({ errors, touched, values }) => (
                    <Form>
                      <div className="mb-4">
                        <label htmlFor="currentPassword" className="form-label text-white">
                          Current Password <span className="text-danger">*</span>
                        </label>
                        <Field
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          className={`form-control bg-dark text-white border-secondary ${
                            touched.currentPassword && errors.currentPassword ? 'is-invalid' : ''
                          }`}
                          placeholder="Enter your current password"
                        />
                        <ErrorMessage name="currentPassword" component="div" className="invalid-feedback d-block" />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="newPassword" className="form-label text-white">
                          New Password <span className="text-danger">*</span>
                        </label>
                        <Field
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          className={`form-control bg-dark text-white border-secondary ${
                            touched.newPassword && errors.newPassword ? 'is-invalid' : ''
                          }`}
                          placeholder="Enter your new password"
                        />
                        <ErrorMessage name="newPassword" component="div" className="invalid-feedback d-block" />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="confirmPassword" className="form-label text-white">
                          Confirm New Password <span className="text-danger">*</span>
                        </label>
                        <Field
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          className={`form-control bg-dark text-white border-secondary ${
                            touched.confirmPassword && errors.confirmPassword ? 'is-invalid' : ''
                          }`}
                          placeholder="Confirm your new password"
                        />
                        <ErrorMessage name="confirmPassword" component="div" className="invalid-feedback d-block" />
                      </div>

                      <div className="d-flex justify-content-between">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => navigate('/profile')}
                        >
                          <i className="fas fa-arrow-left me-2"></i>Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Updating...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-key me-2"></i>Change Password
                            </>
                          )}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>

            <div className="card bg-dark border-danger mt-5 shadow-sm">
              <div className="card-body">
                <h5 className="card-title text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Security Notice
                </h5>
                <p className="card-text">
                  After changing your password, you'll need to log in again with your new password.
                  Make sure to use a strong, unique password that you don't use for other websites.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ChangePasswordPage; 