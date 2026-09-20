'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Card, CardContent, CardHeader } from '@/components/Card';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  timestamp: string;
  user: {
    email: string;
    firstName: string;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<'users' | 'logs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'USER',
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const decoded = JSON.parse(atob(parts[1]));
        if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
          router.push('/dashboard');
          return;
        }
        setUser(decoded);
        fetchUsers(token);
        fetchLogs(token);
      }
    } catch (error) {
      router.push('/');
    }
  }, []);

  const fetchUsers = async (token: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const fetchLogs = async (token: string) => {
    try {
      const res = await fetch('/api/admin/logs?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Fetch logs error:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/');
        return;
      }

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to create user');
        return;
      }

      fetchUsers(token);
      setFormData({ email: '', firstName: '', lastName: '', role: 'USER' });
      setShowUserForm(false);
    } catch (error) {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (userId: string, isActive: boolean) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, isActive: !isActive }),
      });

      if (res.ok) {
        fetchUsers(token);
      }
    } catch (error) {
      console.error('Toggle user error:', error);
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-semibold text-neutral-900 mb-8">Admin Dashboard</h1>

        <div className="flex gap-2 mb-8 border-b border-neutral-200">
          <button
            onClick={() => setTab('users')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              tab === 'users'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              tab === 'logs'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Audit Logs
          </button>
        </div>

        {tab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Manage Users</h2>
              {user.role === 'SUPER_ADMIN' && (
                <Button onClick={() => setShowUserForm(!showUserForm)}>
                  {showUserForm ? 'Cancel' : 'New User'}
                </Button>
              )}
            </div>

            {showUserForm && user.role === 'SUPER_ADMIN' && (
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <form onSubmit={handleCreateUser} className="space-y-4 max-w-md">
                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                    <Input
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                    <Select
                      label="Role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      options={[
                        { value: 'USER', label: 'User' },
                        { value: 'ADMIN', label: 'Admin' },
                        { value: 'SUPER_ADMIN', label: 'Super Admin' },
                      ]}
                    />
                    <Button type="submit" loading={loading}>
                      Create User
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left px-4 py-3 font-semibold text-neutral-900">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-neutral-900">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-neutral-900">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-neutral-900">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-neutral-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-neutral-100 rounded-sm text-xs">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={u.isActive ? 'text-green-600' : 'text-neutral-500'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleUser(u.id, u.isActive)}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Audit Logs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left px-4 py-3 font-semibold text-neutral-900">Action</th>
                    <th className="text-left px-4 py-3 font-semibold text-neutral-900">User</th>
                    <th className="text-left px-4 py-3 font-semibold text-neutral-900">Resource</th>
                    <th className="text-left px-4 py-3 font-semibold text-neutral-900">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-neutral-100 rounded-sm text-xs">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">{log.user.email}</td>
                      <td className="px-4 py-3 text-neutral-500">{log.resourceType}</td>
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
