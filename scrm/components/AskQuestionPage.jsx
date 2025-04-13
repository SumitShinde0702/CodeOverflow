import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../helpers/context/AuthContext';
import Api from '../helpers/api';
import Navbar from './Navbar';
import Footer from './Footer';

const questionSchema = Yup.object().shape({
  title: Yup.string()
    .min(15, 'Title must be at least 15 characters')
    .max(150, 'Title must be less than 150 characters')
    .required('Title is required'),
  body: Yup.string()
    .min(30, 'Question details must be at least 30 characters')
    .required('Question details are required'),
  tags: Yup.array()
    .min(1, 'At least one tag is required')
    .max(5, 'Maximum 5 tags allowed')
    .of(
      Yup.string()
        .min(2, 'Tag must be at least 2 characters')
        .max(20, 'Tag must be less than 20 characters')
    )
});

const AskQuestionPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (values, { setSubmitting }) => {
    if (!isAuthenticated) {
      toast.error('Please login to ask a question');
      navigate('/login');
      return;
    }

    try {
      const response = await Api.postQuestion({
        title: values.title.trim(),
        body: values.body.trim(),
        tags: values.tags,
        userId: user._id
      });

      toast.success('Question posted successfully!');
      navigate(`/questions/${response._id}`);
    } catch (error) {
      console.error('Error posting question:', error);
      toast.error(error.response?.data?.message || 'Failed to post question');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-dark">
      <Navbar />
      <div className="container py-4 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card bg-dark border-secondary">
              <div className="card-body">
                <h2 className="card-title mb-4 text-white">Ask a Question</h2>
                <Formik
                  initialValues={{
                    title: '',
                    body: '',
                    tags: []
                  }}
                  validationSchema={questionSchema}
                  onSubmit={handleSubmit}
                >
                  {({ values, setFieldValue, isSubmitting }) => (
                    <Form>
                      <div className="mb-4">
                        <label htmlFor="title" className="form-label text-white">Title</label>
                        <Field
                          type="text"
                          id="title"
                          name="title"
                          className="form-control bg-dark text-white border-secondary"
                          placeholder="What's your question? Be specific."
                        />
                        <ErrorMessage name="title" component="div" className="text-danger mt-1" />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="body" className="form-label text-white">Body</label>
                        <Field
                          as="textarea"
                          id="body"
                          name="body"
                          className="form-control bg-dark text-white border-secondary"
                          rows="8"
                          placeholder="Explain your question in detail..."
                        />
                        <ErrorMessage name="body" component="div" className="text-danger mt-1" />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="tags" className="form-label text-white">Tags</label>
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          {values.tags.map(tag => (
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

                      <div className="d-flex justify-content-between">
                        <Link to="/questions" className="btn btn-outline-secondary">
                          Cancel
                        </Link>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Posting...
                            </>
                          ) : (
                            'Post Your Question'
                          )}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AskQuestionPage; 