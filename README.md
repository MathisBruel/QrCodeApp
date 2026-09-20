# QR Code Manager

Professional QR code generation and analytics platform with user management and audit logging.

## Features

- 🔐 Secure user authentication with JWT
- 📊 Real-time QR code analytics and tracking
- 👥 Role-based access control (Super Admin, Admin, User)
- 📝 Comprehensive audit logging
- 📧 Email notifications (account creation, password reset)
- 🎯 Click tracking with device/browser detection
- 📱 Responsive, minimal design (Vercel/Linear inspired)
- 🐳 Fully containerized with Docker

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT + bcryptjs
- **Email**: Nodemailer
- **QR Generation**: qrcode library
- **Analytics**: ua-parser-js for device detection

## Quick Start

### Prerequisites
- Docker & Docker Compose
- (Optional) Local Node.js 20+ for development without Docker

### 1. Clone/Extract Project
```bash
cd QrCodeApp
```

### 2. Configure Environment
```bash
# Copy template (Windows)
copy .env.example .env.local

# Or macOS/Linux
cp .env.example .env.local

# Edit with your SMTP credentials
nano .env.local
```

### 3. Start Application
```bash
docker-compose up
```

Wait for "Listening on 3000" message.

### 4. Seed Test Data
```bash
docker-compose exec app npx prisma db seed
```

### 5. Access Application
- **URL**: http://localhost:3000
- **Super Admin**: admin@qrapp.local / SuperAdmin123!
- **Admin**: admin2@qrapp.local / Admin123!
- **User**: user@qrapp.local / User123!

## Project Structure

```
src/
├── app/
│   ├── api/                  # REST API endpoints
│   │   ├── auth/            # Login, logout, password reset
│   │   ├── qr/              # QR generation, tracking, stats
│   │   └── admin/           # User management, audit logs
│   ├── dashboard/           # User QR code dashboard
│   ├── admin/               # Admin control panel
│   ├── page.tsx            # Login page
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/             # UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Navbar.tsx
│   └── ...
└── lib/                    # Utilities
    ├── db.ts              # Prisma client
    ├── auth.ts            # JWT, password hashing
    ├── email.ts           # SMTP integration
    ├── qr.ts              # QR code generation
    ├── analytics.ts       # Device/IP tracking
    └── middleware.ts      # Auth middleware
```

## API Documentation

### Authentication

**Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Reset Password (Request)**
```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "action": "request",
  "email": "user@example.com"
}
```

**Reset Password (Confirm)**
```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "action": "confirm",
  "token": "reset_token_from_email",
  "newPassword": "newPassword123"
}
```

### QR Code Management

**Generate QR Code**
```bash
POST /api/qr/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "My Campaign",
  "targetUrl": "https://example.com",
  "description": "Optional description"
}
```

**Get Statistics**
```bash
GET /api/qr/stats?qrCodeId=optional_id
Authorization: Bearer {token}
```

**QR Code Redirect (Public)**
```bash
GET /api/qr/{shortCode}
# Automatically records click and redirects to target URL
```

### Admin Management

**List Users**
```bash
GET /api/admin/users
Authorization: Bearer {token}
```

**Create User (Super Admin Only)**
```bash
POST /api/admin/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER"
}
```

**Toggle User Status**
```bash
PATCH /api/admin/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user_id",
  "isActive": true
}
```

**Get Audit Logs**
```bash
GET /api/admin/logs?limit=50&offset=0
Authorization: Bearer {token}
```

## Configuration

### Environment Variables

See `.env.example` for all options:

```env
# Database Connection
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT Secret (generate random string for production)
JWT_SECRET=your-secret-key

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Application
APP_URL=http://localhost:3000
NODE_ENV=development
```

### SMTP Setup (Gmail)

1. Enable 2-factor authentication on your Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer" (or your device)
4. Copy the generated password
5. Use as `SMTP_PASS` in `.env`

## Database Schema

### User
- id, email, firstName, lastName, role, isActive, passwordHash, passwordResetToken, createdAt, updatedAt

### QRCode
- id, shortCode, targetUrl, title, description, createdBy, isActive, expiresAt, createdAt, updatedAt

### Click (Analytics)
- id, qrCodeId, userAgent, ipAddress, deviceType, osName, osVersion, browserName, browserVersion, timestamp

### AuditLog
- id, userId, action, resourceType, resourceId, ipAddress, timestamp

## Development

### Local Setup (without Docker)

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Seed test data
npm run prisma:seed

# Start dev server
npm run dev
```

### Run Tests
```bash
npm run lint
```

### Database Migrations
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Push schema
npm run db:push
```

## Production Deployment

1. Update `.env` with production values:
   - Strong JWT_SECRET
   - Real database credentials
   - Production SMTP settings
   - APP_URL to your domain

2. Build Docker image:
   ```bash
   docker build -t qrapp:latest .
   docker-compose -f docker-compose.prod.yml up
   ```

3. Setup reverse proxy (Nginx/Traefik) for HTTPS

4. Regular database backups:
   ```bash
   docker-compose exec postgres pg_dump -U qrapp qrcode_app > backup.sql
   ```

## Security Best Practices

- ✅ Change all default passwords
- ✅ Use HTTPS in production
- ✅ Keep Docker images updated
- ✅ Review audit logs regularly
- ✅ Implement rate limiting (optional, use Nginx)
- ✅ Regular database backups
- ✅ Use environment variables for secrets
- ✅ Enable 2FA on admin accounts

## Troubleshooting

### Port 3000 already in use
Edit `docker-compose.yml` and change port mapping.

### Database connection error
```bash
docker-compose logs postgres
docker-compose down -v  # Reset database
docker-compose up
```

### Email not working
- Check SMTP credentials in `.env`
- Verify sender email is authorized
- Check spam folder
- Review logs: `docker-compose logs app`

### Authentication issues
- Clear browser cookies/localStorage
- Check JWT_SECRET matches across restarts
- Verify token expiration (7 days default)

## License

MIT - See LICENSE file

## Support

For issues or questions:
1. Check DEPLOY.md for detailed setup guide
2. Review docker-compose logs: `docker-compose logs`
3. Verify all environment variables are set
4. Ensure database is running: `docker-compose ps`
