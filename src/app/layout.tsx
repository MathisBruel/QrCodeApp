import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QR Code Manager',
  description: 'Professional QR code generation and analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
