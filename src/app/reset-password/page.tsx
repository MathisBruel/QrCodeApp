'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent } from '@/components/Card';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [mode, setMode] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setMode('confirm');
    }
  }, [token]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email }),
      });

      if (!res.ok) {
        setError('Failed to send reset email');
        return;
      }

      setSuccess('Check your email for reset instructions');
      setEmail('');
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', token, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to reset password');
        return;
      }

      setSuccess('Password reset successful. Redirecting to login...');
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-8 pb-8">
          <h1 className="text-2xl font-semibold mb-1 text-center">Reset Password</h1>
          <p className="text-sm text-neutral-500 text-center mb-6">
            {mode === 'request' ? 'Enter your email to receive reset instructions' : 'Create a new password'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-sm text-sm mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded-sm text-sm mb-4">
              {success}
            </div>
          )}

          {mode === 'request' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
              <Button type="submit" className="w-full" loading={loading}>
                Send Reset Email
              </Button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Button type="submit" className="w-full" loading={loading}>
                Reset Password
              </Button>
            </form>
          )}

          <p className="text-sm text-neutral-600 text-center mt-6">
            <button
              onClick={() => router.push('/')}
              className="underline hover:text-neutral-900"
            >
              Back to login
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
