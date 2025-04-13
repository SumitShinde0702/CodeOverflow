import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../helpers/context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary">
      <div className="container-fluid">
        <Link className="navbar-brand gradient-text fs-4" to="/">
          <i className="fas fa-code me-2"></i>
          CodeOverflow
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link text-light" to="/">
                <i className="fas fa-home me-1"></i>Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-light" to="/questions">
                <i className="fas fa-question-circle me-1"></i>Questions
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-light" to="/users">
                <i className="fas fa-users me-1"></i>Users
              </Link>
            </li>
            {user && (
              <li className="nav-item">
                <Link className="nav-link text-light" to="/ask">
                  <i className="fas fa-plus-circle me-1"></i>Ask Question
                </Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center">
            {user ? (
              <>
                <Link to="/profile" className="btn btn-outline-light me-2">
                  <i className="fas fa-user me-1"></i>Profile
                </Link>
                <button onClick={handleLogout} className="btn btn-outline-danger">
                  <i className="fas fa-sign-out-alt me-1"></i>Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary me-2">
                  <i className="fas fa-sign-in-alt me-1"></i>Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  <i className="fas fa-user-plus me-1"></i>Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 