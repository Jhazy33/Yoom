"use client";

import { useState, useEffect } from "react";
import { useAuth, type User } from "@/components/auth-provider";

interface UserManagementProps {
  currentUser: User;
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  // Debug: Log to check if component renders
  console.log('UserManagement rendered, currentUser:', currentUser);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching users from /api/users...');
      const res = await fetch('/api/users');
      const data = await res.json();
      console.log('Users API response:', data);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load users');
      }

      setUsers(data.users || []);
      console.log('Users loaded:', data.users);
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Load users on mount
  useEffect(() => {
    console.log('UserManagement component mounted, currentUser.role:', currentUser.role);
    if (currentUser.role === 'admin') {
      loadUsers();
    }
  }, [currentUser.role]);

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowAddModal(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  if (currentUser.role !== 'admin') {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 px-4 py-3 rounded">
        ⚠️ User Management is only available to administrators
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
        >
          + Add New User
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-raised">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Username</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Role</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Folders</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-surface-raised">
                <td className="px-6 py-4 text-sm">{user.username}</td>
                <td className="px-6 py-4 text-sm">{user.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === 'admin'
                      ? 'bg-purple-500/10 text-purple-500'
                      : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted">
                  {user.allowedFolders?.join(', ') || 'None'}
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-accent hover:underline"
                  >
                    Edit
                  </button>
                  {user.id !== currentUser.id && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddUserModal
          user={editingUser}
          onClose={() => {
            setShowAddModal(false);
            setEditingUser(null);
          }}
          onSave={async () => {
            await loadUsers();
            setShowAddModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

interface AddUserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}

function AddUserModal({ user, onClose, onSave }: AddUserModalProps) {
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>(user?.role || 'user');
  const [allowedFolders, setAllowedFolders] = useState(user?.allowedFolders?.join(', ') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        username,
        email,
        role,
        allowedFolders: allowedFolders ? allowedFolders.split(',').map(f => f.trim()) : []
      };

      if (password) {
        payload.password = password;
      }

      const url = user ? `/api/users/${user.id}` : '/api/users';
      const method = user ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save user');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 space-y-4">
        <h3 className="text-xl font-bold">
          {user ? 'Edit User' : 'Add New User'}
        </h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!user}
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
              className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-muted mt-1">
              {role === 'admin' ? 'Admin: Can see all recordings and manage users' : 'User: Can only see their assigned folders'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Folder Access (comma-separated)</label>
            <input
              type="text"
              value={allowedFolders}
              onChange={(e) => setAllowedFolders(e.target.value)}
              placeholder="yoom-videos/username/, yoom-videos/project-x/"
              className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-muted mt-1">
              Leave empty for no access. Use "*" for admin access to all folders.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-raised transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : user ? 'Update' : 'Add'} User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
