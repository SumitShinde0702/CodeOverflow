import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import Api from '../helpers/api';
import Navbar from './Navbar';

const UserCard = ({ user }) => {
  if (!user) return null;

  const username = user.username || 'Anonymous User';
  const joinDate = new Date(user.created || user.createdAt).toLocaleDateString();
  const imagePath = user.profilePicture ? 
    `http://localhost:3000/uploads/${user.profilePicture.split('/').pop()}` : 
    '/images/default-avatar.png';
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-6">
        <img 
          src={imagePath}
          alt={`${username}'s avatar`}
          className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
          style={{
            width: '80px',
            height: '80px',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/default-avatar.png';
          }}
          loading="lazy"
        />
        <div className="flex-grow">
          <div className="flex items-center gap-4">
            <Link to={`/users/${user._id}`} className="text-2xl font-semibold text-blue-400 hover:text-blue-300">
              {username}
            </Link>
            <span className="px-2 py-1 bg-blue-500 text-sm rounded-full text-white">
              {user.reputation || 0} Rep
            </span>
          </div>
          <div className="text-gray-400 text-sm mt-2">Member since {joinDate}</div>
          <div className="mt-3 flex space-x-6 text-sm">
            <span className="text-gray-400">
              <span className="font-bold">{user.totalQuestions || 0}</span> Questions
            </span>
            <span className="text-gray-400">
              <span className="font-bold">{user.totalAnswers || 0}</span> Answers
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('reputation');
  const navigate = useNavigate();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: Api.getUsers,
    onError: (error) => {
      console.error('Error loading users:', error);
      toast.error(error.message || 'Failed to load users');
    }
  });

  const filteredUsers = users
    .filter(user => 
      user && user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'reputation') {
        return (b.reputation || 0) - (a.reputation || 0);
      }
      return new Date(b.created || b.createdAt) - new Date(a.created || a.createdAt);
    });

  return (
    <div className="bg-dark min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <button 
          className="mb-4 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded"
          onClick={() => navigate('/questions')}
        >
          &larr; Back to Questions
        </button>
        <h1 className="text-3xl font-bold mb-4">Users</h1>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            <option value="reputation">Sort by Reputation</option>
            <option value="joined">Sort by Join Date</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="spinner-border text-blue-500" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">
            {error.message || 'Error loading users'}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No users found matching "{searchTerm}"
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map(user => (
              <UserCard key={user._id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage; 