const SERVER_PREFIX = "http://localhost:3000/api";

// Helper function to handle responses
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  if (!response.ok) {
    let error;
    try {
      if (contentType && contentType.includes('application/json')) {
        error = await response.json();
      } else {
        error = await response.text();
      }
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
    } catch (e) {
      console.error('Error parsing error response:', e);
      error = { message: 'An error occurred' };
    }
    throw new Error(error.message || 'Request failed');
  }

  try {
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('API Success Response:', data);
      return data;
    }
    const text = await response.text();
    console.error('Unexpected non-JSON response:', text);
    throw new Error('Unexpected non-JSON response');
  } catch (e) {
    console.error('Error parsing success response:', e);
    throw new Error('Failed to parse response');
  }
};

// Helper function to get auth headers
const getAuthHeaders = (requireAuth = true) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  if (token && requireAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

const Api = {
  // Public endpoints (no auth required)
  getQuestions(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.unanswered) {
      queryParams.append('unanswered', 'true');
    }
    
    return fetch(`${SERVER_PREFIX}/questions?${queryParams.toString()}`, {
      headers: getAuthHeaders(false)
    }).then(handleResponse);
  },

  getQuestionById(id) {
    return fetch(`${SERVER_PREFIX}/questions/${id}`, {
      headers: getAuthHeaders(false)
    }).then(handleResponse);
  },

  getAnswers(questionId) {
    return fetch(`${SERVER_PREFIX}/questions/${questionId}/answers`, {
      headers: getAuthHeaders(false)
    }).then(handleResponse);
  },

  getUsers() {
    return fetch(`${SERVER_PREFIX}/users`, {
      headers: getAuthHeaders(false)
    }).then(handleResponse)
    .then(data => {
      console.log('Raw users response:', data);
      // Ensure we always return an array
      return Array.isArray(data) ? data : (data ? [data] : []);
    });
  },

  getUserById(userId) {
    return fetch(`${SERVER_PREFIX}/users/${userId}`, {
      headers: getAuthHeaders(false)
    }).then(handleResponse);
  },

  // Protected endpoints (auth required)
  login(credentials) {
    return fetch(`${SERVER_PREFIX}/users/login`, {
      headers: getAuthHeaders(false),
      method: 'POST',
      body: JSON.stringify(credentials)
    }).then(handleResponse);
  },

  register(userData) {
    // userData should be FormData
    if (!(userData instanceof FormData)) {
      throw new Error('userData must be FormData');
    }

    return fetch(`${SERVER_PREFIX}/users`, {
      method: 'POST',
      body: userData
      // Don't set Content-Type header - browser will set it with boundary for FormData
    }).then(handleResponse);
  },

  getUserProfile() {
    return fetch(`${SERVER_PREFIX}/users/profile`, {
      headers: getAuthHeaders(true)
    }).then(handleResponse);
  },

  updateProfile(userData) {
    const token = localStorage.getItem('token');
    if (!token) {
      return Promise.reject(new Error('No authentication token found'));
    }

    // Don't set Content-Type for FormData
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    return fetch(`${SERVER_PREFIX}/users/profile`, {
      method: 'POST',
      headers,
      body: userData
    })
    .then(async response => {
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        const errorData = isJson ? await response.json() : await response.text();
        console.error('Profile update failed:', errorData);
        throw new Error(isJson ? errorData.message : errorData || 'Failed to update profile');
      }

      if (!isJson) {
        console.error('Unexpected non-JSON response:', await response.text());
        throw new Error('Invalid response format from server');
      }

      const data = await response.json();
      console.log('Profile update successful:', data);
      return data;
    })
    .catch(error => {
      console.error('Profile update error:', error);
      throw error;
    });
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    console.log('changePassword called with:', {
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword
    });

    if (!currentPassword || !newPassword) {
      throw new Error('Both current password and new password are required');
    }

    try {
      const response = await fetch(`${SERVER_PREFIX}/users/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          oldPassword: currentPassword,
          newPassword: newPassword
        })
      });

      console.log('Password change response status:', response.status);
      
      const data = await response.json();
      console.log('Password change response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return true;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  },

  deleteAccount: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${SERVER_PREFIX}/users/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete account');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  postQuestion(data) {
    return fetch(`${SERVER_PREFIX}/questions`, {
      headers: getAuthHeaders(true),
      method: 'POST',
      body: JSON.stringify(data)
    }).then(handleResponse);
  },

  updateQuestion(id, data) {
    return fetch(`${SERVER_PREFIX}/questions/${id}`, {
      headers: getAuthHeaders(true),
      method: 'PUT',
      body: JSON.stringify(data)
    }).then(handleResponse);
  },

  deleteQuestion(id) {
    return fetch(`${SERVER_PREFIX}/questions/${id}`, {
      headers: getAuthHeaders(true),
      method: 'DELETE'
    }).then(handleResponse);
  },

  postAnswer(questionId, data) {
    return fetch(`${SERVER_PREFIX}/questions/${questionId}/answers`, {
      headers: getAuthHeaders(true),
      method: 'POST',
      body: JSON.stringify(data)
    }).then(handleResponse);
  },

  updateAnswer(id, data) {
    return fetch(`${SERVER_PREFIX}/answers/${id}`, {
      headers: getAuthHeaders(true),
      method: 'PUT',
      body: JSON.stringify(data)
    }).then(handleResponse);
  },

  deleteAnswer(id) {
    return fetch(`${SERVER_PREFIX}/answers/${id}`, {
      headers: getAuthHeaders(true),
      method: 'DELETE'
    }).then(handleResponse);
  },

  upvoteQuestion(id) {
    return fetch(`${SERVER_PREFIX}/questions/${id}/upvote`, {
      headers: getAuthHeaders(true),
      method: 'POST'
    }).then(handleResponse);
  },

  downvoteQuestion(id) {
    return fetch(`${SERVER_PREFIX}/questions/${id}/downvote`, {
      headers: getAuthHeaders(true),
      method: 'POST'
    }).then(handleResponse);
  },

  upvoteAnswer(id) {
    return fetch(`${SERVER_PREFIX}/answers/${id}/upvote`, {
      headers: getAuthHeaders(true),
      method: 'POST'
    }).then(handleResponse);
  },

  downvoteAnswer(id) {
    return fetch(`${SERVER_PREFIX}/answers/${id}/downvote`, {
      headers: getAuthHeaders(true),
      method: 'POST'
    }).then(handleResponse);
  },

  getUserQuestions(userId) {
    return fetch(`${SERVER_PREFIX}/users/${userId}/questions`, {
      headers: getAuthHeaders(false)
    }).then(handleResponse);
  },

  getUserAnswers(userId) {
    return fetch(`${SERVER_PREFIX}/users/${userId}/answers`, {
      headers: getAuthHeaders(false)
    }).then(handleResponse);
  }
};

export default Api;