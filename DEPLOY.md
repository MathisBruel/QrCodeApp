# QR Code Manager - Deployment Guide

## Prerequisites

- Docker & Docker Compose installed
- PostgreSQL knowledge (optional)
- SMTP server credentials (Gmail, SendGrid, etc.)

## Quick Start (Development)

```bash
# 1. Clone or extract the project
cd QrCodeApp

# 2. Create environment file
cp .env.example .env

# 3. Edit .env with your settings
nano .env  # or use your preferred editor

# 4. Start the application
docker-compose up

# 5. Access the app
# Frontend: http://localhost:3000
# Database: localhost:5432
```

## Default Test Credentials

After first run, seed database with test users:

```bash
docker-compose exec app npx prisma db seed
```

**Test Accounts:**
- **Super Admin:** admin@qrapp.local / SuperAdmin123!
- **Admin:** admin2@qrapp.local / Admin123!
- **User:** user@qrapp.local / User123!

## Environment Configuration

### Required Variables

```
DATABASE_URL=postgresql://qrapp:PASSWORD@postgres:5432/qrcode_app
JWT_SECRET=your-random-jwt-secret-here
APP_URL=http://localhost:3000 (or your production domain)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@qrapp.local
NODE_ENV=development
```

### SMTP Configuration Examples

**Gmail:**
- SMTP_HOST: `smtp.gmail.com`
- SMTP_PORT: `587`
- SMTP_USER: your Gmail address
- SMTP_PASS: Generate an [App Password](https://myaccount.google.com/apppasswords)

**SendGrid:**
- SMTP_HOST: `smtp.sendgrid.net`
- SMTP_PORT: `587`
- SMTP_USER: `apikey`
- SMTP_PASS: Your SendGrid API key

## Database Schema

Tables:
- **User**: Stores user accounts with roles (SUPER_ADMIN, ADMIN, USER)
- **QRCode**: Generated QR codes with tracking URLs
- **Click**: Analytics for each scan (device, browser, IP, timestamp)
- **AuditLog**: All user actions for compliance

## API Endpoints

### Authentication
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `POST /api/auth/reset-password` - Request/confirm password reset

### QR Codes
- `POST /api/qr/generate` - Create new QR code (requires auth)
- `GET /api/qr/[shortCode]` - Redirect & track click (public)
- `GET /api/qr/stats` - Get analytics (requires auth)

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user (Super Admin only)
- `PATCH /api/admin/users` - Activate/deactivate user
- `GET /api/admin/logs` - View audit logs

## File Structure

```
.
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # User dashboard
│   │   ├── admin/            # Admin panel
│   │   └── layout.tsx        # Global layout
│   ├── components/           # Reusable UI components
│   └── lib/                  # Utilities (auth, email, QR, etc.)
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # SQL migrations
│   └── seed.ts              # Test data seeding
├── docker-compose.yml        # Docker orchestration
├── Dockerfile               # Container configuration
└── package.json             # Dependencies
```

## Production Deployment

### 1. Update Environment

```bash
# Use .env.production with real values
APP_URL=https://yourdomain.com
NODE_ENV=production
JWT_SECRET=generate-random-string-at-least-32-chars
```

### 2. Generate Random Secrets

```bash
# JWT Secret
openssl rand -base64 32

# Password for database
openssl rand -base64 16
```

### 3. Docker Compose (Production)

Update `docker-compose.yml`:
- Change `POSTGRES_PASSWORD`
- Set `APP_URL` to production domain
- Use environment file or secrets manager

### 4. HTTPS/SSL

Use a reverse proxy (Nginx, Traefik) in front of the Docker setup.

### 5. Database Backups

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U qrapp qrcode_app > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U qrapp qrcode_app < backup.sql
```

## Troubleshooting

### Port already in use
```bash
# Change port in docker-compose.yml
# services.app.ports: "3001:3000"
```

### Database connection error
```bash
# Check if postgres is healthy
docker-compose ps

# View logs
docker-compose logs postgres
```

### SMTP/Email not working
```bash
# Check SMTP credentials in .env
# Ensure less secure apps enabled (Gmail)
# Test with: docker-compose logs app
```

### Reset database
```bash
docker-compose down -v  # Remove volumes
docker-compose up       # Start fresh
```

## Security Notes

- Change all default passwords immediately
- Use strong JWT_SECRET (minimum 32 characters)
- Enable HTTPS in production
- Keep Docker images updated
- Use `.env` file with restricted permissions (chmod 600)
- Regularly backup database
- Review audit logs periodically

## Performance Tuning

- Database indexes on User.email, QRCode.shortCode, Click.timestamp
- Implement Redis caching for stats (optional)
- Use CDN for QR code images
- Monitor database query performance

## Support

- Check `docker-compose logs` for errors
- Verify all environment variables are set
- Ensure database is running: `docker-compose ps`
- Review Prisma docs: https://www.prisma.io/docs/
