'use client';

import { useState } from 'react';

export default function TestAPI() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '' });

  const fetchUsers = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
        setMessage(`Successfully fetched ${data.length} user(s)`);
      } else {
        setMessage(`Error: ${data.error || 'Failed to fetch users'}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('User created successfully!');
        setFormData({ name: '', email: '' });
        fetchUsers(); // Refresh the list
      } else {
        setMessage(`Error: ${data.error || 'Failed to create user'}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">API Testing Page</h1>

      {/* Create User Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Create User</h2>
        <form onSubmit={createUser} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>

      {/* Fetch Users */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Users List</h2>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Fetch Users'}
          </button>
        </div>
        {users.length > 0 && (
          <div className="mt-4">
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
              {JSON.stringify(users, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.startsWith('Error')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Make sure your MySQL database is running and configured in <code className="bg-gray-200 px-1 rounded">.env</code></li>
          <li>Run <code className="bg-gray-200 px-1 rounded">npm run db:push</code> to create the database tables</li>
          <li>Start the dev server: <code className="bg-gray-200 px-1 rounded">npm run dev</code></li>
          <li>Visit this page at <code className="bg-gray-200 px-1 rounded">http://localhost:3000/test-api</code></li>
          <li>Test creating a user and fetching users</li>
        </ol>
      </div>
    </div>
  );
}
