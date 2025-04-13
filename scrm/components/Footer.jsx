const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 border-top border-secondary mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
            <span className="gradient-text">
              <i className="fas fa-code me-2"></i>
              CodeOverflow
            </span>
            <p className="text-muted mb-0 mt-2">
              A community for developers to learn, share, and grow together.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <div className="social-links">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-light me-3">
                <i className="fab fa-github"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-light me-3">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-light">
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
            <p className="text-muted mb-0 mt-2">
              © {new Date().getFullYear()} CodeOverflow. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 