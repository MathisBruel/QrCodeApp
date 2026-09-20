'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from './Button';

interface NavbarProps {
  user?: {
    email: string;
    firstName: string;
    role: string;
  };
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  return (
    <nav className="border-b border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-neutral-900">
          QR Manager
        </Link>

        <div className="flex items-center gap-6">
          {user && (
            <>
              <Link href="/dashboard" className="text-sm text-neutral-600 hover:text-neutral-900">
                Dashboard
              </Link>
              {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                <Link href="/admin" className="text-sm text-neutral-600 hover:text-neutral-900">
                  Admin
                </Link>
              )}
              <div className="text-sm text-neutral-600">
                {user.firstName}
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
