'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent, CardHeader } from '@/components/Card';

interface QRCode {
  id: string;
  title: string;
  description?: string;
  shortCode: string;
  targetUrl: string;
  trackingUrl: string;
  qrDataURL: string;
  clicks: number;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetUrl: '',
    customSlug: '',
  });
  const [formError, setFormError] = useState('');
  const [editingQr, setEditingQr] = useState<QRCode | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    targetUrl: '',
    customSlug: '',
  });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchDashboard(token);
  }, []);

  const fetchDashboard = async (token: string) => {
    try {
      // Decode JWT to get user info (basic parsing without verification)
      const parts = token.split('.');
      if (parts.length === 3) {
        const decoded = JSON.parse(atob(parts[1]));
        setUser({
          id: decoded.userId,
          email: decoded.email,
          firstName: 'User',
          lastName: '',
          role: decoded.role,
        });
      }

      const res = await fetch('/api/qr/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem('auth_token');
        router.push('/');
        return;
      }

      const data = await res.json();
      setQRCodes(data.stats.qrCodes || []);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleGenerateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/');
        return;
      }

      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          customSlug: formData.customSlug.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to generate QR code');
        return;
      }

      setQRCodes([...qrCodes, data.qrCode]);
      setFormData({ title: '', description: '', targetUrl: '', customSlug: '' });
      setShowForm(false);
    } catch (error) {
      setFormError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (qr: QRCode) => {
    setShowForm(false);
    setEditingQr(qr);
    setEditError('');
    setEditFormData({
      title: qr.title,
      description: qr.description || '',
      targetUrl: qr.targetUrl,
      customSlug: qr.shortCode,
    });
  };

  const handleUpdateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQr) return;

    const slugChanged = editFormData.customSlug.trim() !== editingQr.shortCode;
    if (slugChanged) {
      const confirmed = window.confirm(
        'Changing the link changes the QR code image. Anywhere the old QR code was printed or shared will stop working. Continue?'
      );
      if (!confirmed) return;
    }

    setEditLoading(true);
    setEditError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/');
        return;
      }

      const res = await fetch(`/api/qr/${editingQr.shortCode}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editFormData,
          customSlug: editFormData.customSlug.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || 'Failed to update QR code');
        return;
      }

      setQRCodes(qrCodes.map((qr) => (qr.id === data.qrCode.id ? data.qrCode : qr)));
      setEditingQr(null);
    } catch (error) {
      setEditError('An error occurred');
    } finally {
      setEditLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">QR Code Generator</h1>
            <p className="text-neutral-500 mt-1">Generate and track your QR codes</p>
          </div>
          <Button
            onClick={() => {
              setEditingQr(null);
              setShowForm(!showForm);
            }}
            variant={showForm ? 'secondary' : 'primary'}
          >
            {showForm ? 'Cancel' : 'New QR Code'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-lg font-semibold">Create New QR Code</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateQR} className="space-y-4">
                <Input
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Product Page"
                  required
                />
                <Input
                  label="Target URL"
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  placeholder="https://example.com"
                  required
                />
                <Input
                  label="Description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details about this QR code"
                />
                <div>
                  <Input
                    label="Custom link (optional)"
                    value={formData.customSlug}
                    onChange={(e) => setFormData({ ...formData, customSlug: e.target.value })}
                    placeholder="my-campaign"
                  />
                  <p className="text-xs text-neutral-500 mt-1 truncate">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/api/qr/
                    {formData.customSlug || '(auto-generated)'}
                  </p>
                </div>
                {formError && (
                  <p className="text-sm text-red-600">{formError}</p>
                )}
                <Button type="submit" loading={loading}>
                  Generate QR Code
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {editingQr && (
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-lg font-semibold">Edit QR Code</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateQR} className="space-y-4">
                <Input
                  label="Title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="e.g., Product Page"
                  required
                />
                <Input
                  label="Target URL"
                  type="url"
                  value={editFormData.targetUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, targetUrl: e.target.value })}
                  placeholder="https://example.com"
                  required
                />
                <Input
                  label="Description (optional)"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Add details about this QR code"
                />
                <div>
                  <Input
                    label="Custom link"
                    value={editFormData.customSlug}
                    onChange={(e) => setEditFormData({ ...editFormData, customSlug: e.target.value })}
                    placeholder="my-campaign"
                  />
                  <p className="text-xs text-neutral-500 mt-1 truncate">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/api/qr/
                    {editFormData.customSlug || '(auto-generated)'}
                  </p>
                  {editFormData.customSlug.trim() !== editingQr.shortCode && (
                    <p className="text-sm text-amber-600 mt-2">
                      Warning: changing the link changes the QR code image. Anywhere the current
                      QR code was printed or shared will stop working.
                    </p>
                  )}
                </div>
                {editError && <p className="text-sm text-red-600">{editError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" loading={editLoading}>
                    Save Changes
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingQr(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map((qr) => (
            <Card key={qr.id} className="overflow-hidden">
              <CardContent className="pt-6 pb-0">
                <img
                  src={qr.qrDataURL}
                  alt={qr.title}
                  className="w-full aspect-square border border-neutral-200 rounded-sm mb-4"
                />
                <h3 className="font-semibold text-neutral-900 truncate">{qr.title}</h3>
                <p className="text-sm text-neutral-500 mt-1 truncate">{qr.targetUrl}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
                  <div>
                    <p className="text-2xl font-semibold text-neutral-900">{qr.clicks}</p>
                    <p className="text-xs text-neutral-500">Clicks</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(qr)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(qr.trackingUrl)}
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {qrCodes.length === 0 && !showForm && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-600 mb-4">No QR codes yet</p>
              <Button onClick={() => setShowForm(true)}>Create your first QR code</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
