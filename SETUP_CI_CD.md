# CI/CD Setup Guide

Déploiement automatisé avec GitHub Actions + GHCR + VPS.

## Architecture

```
Git Push (main)
    ↓
GitHub Actions Build
    ↓
Push vers GHCR (GitHub Container Registry)
    ↓
VPS Deploy (SSH pull + docker compose restart)
```

## Fichiers créés

- `Dockerfile.prod` — Production multistage build
- `.github/workflows/deploy.yml` — GitHub Actions workflow
- `docker-compose.prod.yml` — Configuration production
- `.env.production.example` — Template variables

## Setup VPS

### 1. Préparer VPS

```bash
# SSH sur VPS
ssh user@vps.com

# Créer répertoire app
sudo mkdir -p /opt/qrcodeapp
cd /opt/qrcodeapp

# Init git repo bare (ou clone existing)
git init

# Installer Docker (si besoin)
curl -fsSL https://get.docker.com | sh

# Créer user pour deploy (optionnel)
sudo useradd -m deploy
sudo usermod -aG docker deploy
```

### 2. Configurer SSH key

```bash
# Sur local, générer key SSH si besoin
ssh-keygen -t ed25519 -f ~/.ssh/vps_deploy -N ""

# Ajouter public key à VPS
ssh-copy-id -i ~/.ssh/vps_deploy.pub user@vps.com

# Copier private key et l'ajouter aux secrets GitHub
cat ~/.ssh/vps_deploy
```

## Setup GitHub Secrets

Ajouter ces secrets dans Settings → Secrets and variables → Actions:

| Secret | Valeur | Exemple |
|--------|--------|---------|
| `VPS_HOST` | Hostname/IP VPS | `vps.example.com` ou `203.0.113.1` |
| `VPS_USER` | SSH user | `deploy` ou `ubuntu` |
| `VPS_SSH_KEY` | Private SSH key (entière) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_APP_PATH` | Chemin app sur VPS | `/opt/qrcodeapp` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://qrapp:secure_pass@postgres:5432/qrcode_app` |
| `DATABASE_PASSWORD` | PostgreSQL password | `secure_random_password` |
| `JWT_SECRET` | JWT secret key | Chaîne aléatoire longue |
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Email address | `your_email@gmail.com` |
| `SMTP_PASS` | App password ou token | `your_app_password` |
| `SMTP_FROM` | Email from | `noreply@yourdomain.com` |
| `APP_URL` | App URL | `https://qrcode.yourdomain.com` |

## Workflow

### 1. Push sur main déclenche:

1. **Build** — Dockerfile.prod construit image multistage
2. **Push** — Image publiée sur GHCR avec tags:
   - `main-<sha-complet>` (commit courant)
   - `main` (latest de main)
3. **Deploy** — SSH sur VPS et:
   - Récupère latest code
   - Crée .env.production avec secrets
   - Lance `docker compose -f docker-compose.prod.yml up -d --pull always`
   - Nettoie images orphanes

### 2. Manuel: Redéployer version existante

```bash
# Sur VPS
cd /opt/qrcodeapp
git pull origin main
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --pull always
```

## Logs & Debug

### Logs GitHub Actions
`https://github.com/MathisBruel/QrCodeApp/actions`

### Logs VPS
```bash
# Services en cours
docker compose -f docker-compose.prod.yml logs -f

# Tous les containers
docker ps -a

# Image pulls
docker pull ghcr.io/mathisbrul/qrcodeapp:main-<sha>
```

## Sécurité

✅ Secrets jamais en logs (utilise `secrets.`)
✅ SSH key privée stockée dans GitHub Secrets (jamais en repo)
✅ Production database isolée (127.0.0.1:5432)
✅ Migrations auto (`npx prisma migrate deploy`)
✅ Image multistage (pas de build deps en production)

## Troubleshooting

**Image pull fails sur VPS**
```bash
# Vérifier login GHCR
docker login ghcr.io -u USERNAME -p TOKEN

# Tester pull manuel
docker pull ghcr.io/mathisbrul/qrcodeapp:main-<sha>
```

**Database migration fails**
```bash
# Sur VPS, vérifier DB connection
docker compose -f docker-compose.prod.yml exec postgres psql -U qrapp -d qrcode_app -c "SELECT 1"
```

**SSH key permission denied**
```bash
# Sur VPS
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```
