import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Api from '../api';

// Create the authentication context
const AuthContext = createContext(null);

// AuthProvider component to manage authentication state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await Api.getUserProfile();
      if (userData) {
        setUser(userData);
      } else {
        // If no user data, clear the invalid token
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Only remove token if it's an authentication error
      if (error.message.includes('401') || error.message.includes('403')) {
        localStorage.removeItem('token');
        setUser(null);
      }
      // For other errors, keep the token and user state
    }
    setLoading(false);
  };

  // Add a new effect to persist user data
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  // Add effect to restore user data on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing saved user:', e);
        localStorage.removeItem('user');
      }
    }
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await Api.login(credentials);
      const { token, user } = response;
      localStorage.setItem('token', token);
      setUser(user);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      await Api.register(userData);
      toast.success('Registration successful! Please login.');
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.info('Logged out successfully');
  };

  const updateProfile = async (userData) => {
    try {
      console.log('Updating profile with data:', userData);
      const updatedUser = await Api.updateProfile(userData);
      
      if (!updatedUser) {
        throw new Error('No response received from server');
      }
      
      console.log('Profile update successful:', updatedUser);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      if (error.message.includes('401')) {
        localStorage.removeItem('token');
        setUser(null);
        toast.error('Session expired. Please login again.');
      } else {
        toast.error(error.message || 'Failed to update profile');
      }
      return false;
    }
  };

  const changePassword = async (passwordData) => {
    try {
      console.log('Attempting to change password...');
      const success = await Api.changePassword(passwordData);
      
      if (success) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      await Api.deleteAccount();
      localStorage.removeItem('token');
      setUser(null);
      toast.success('Account deleted successfully');
      return true;
    } catch (error) {
      console.error('Account deletion failed:', error);
      if (error.message.includes('401')) {
        localStorage.removeItem('token');
        setUser(null);
        toast.error('Session expired. Please login again.');
      } else {
        toast.error(error.message || 'Failed to delete account');
      }
      return false;
    }
  };

  // If still loading, show loading indicator
  if (loading) {
    return <div>Loading authentication...</div>;
  }

  // Provide the authentication context value
  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      deleteAccount
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 