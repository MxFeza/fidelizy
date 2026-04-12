# Izou — Guide de deploiement

> Genere le : 2026-03-23 | Scan exhaustif

## Infrastructure

| Service | Role | URL |
|---------|------|-----|
| **Vercel** | Hebergement + CDN + Serverless | https://fidelizy.vercel.app |
| **Supabase** | PostgreSQL + Auth + RLS | https://ggzgffwykthufieeikzb.supabase.co |
| **Upstash** | Redis (rate limiting) | Via env var |
| **Apple APNs** | Push notifications Wallet | api.push.apple.com |

## Deploiement Vercel

### Auto-deploy

Le projet est configure en auto-deploy depuis la branche `main` du repo GitHub `MxFeza/fidelizy`. Chaque push sur `main` declenche un build et deploiement automatique.

### Configuration Vercel

**Framework** : Next.js (detecte automatiquement)
**Build command** : `next build`
**Output directory** : `.next`
**Node.js version** : 18+ (default Vercel)

### Variables d'environnement Vercel

Configurer dans Vercel > Settings > Environment Variables :

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Cle publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Cle service (bypass RLS) |
| `KV_REST_API_URL` | Server only | URL Upstash Redis |
| `KV_REST_API_TOKEN` | Server only | Token Upstash |
| `APPLE_PASS_TYPE_ID` | Server only | ID pass Apple Wallet |
| `APPLE_TEAM_ID` | Server only | Team ID Apple |
| `WALLET_AUTH_SECRET` | Server only | Secret HMAC wallet |
| `APPLE_PASS_CERT_B64` | Server only | Certificat Apple (base64) |
| `APPLE_PASS_KEY_B64` | Server only | Cle privee Apple (base64) |
| `APPLE_WWDR_CERT_B64` | Server only | WWDR Apple (base64) |
| `VAPID_PUBLIC_KEY` | Server only | Cle publique VAPID |
| `VAPID_PRIVATE_KEY` | Server only | Cle privee VAPID |
| `VAPID_SUBJECT` | Server only | Contact VAPID |
| `CRON_SECRET` | Server only | Secret pour cron jobs |

### Cron Jobs

Definis dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/push-inactive",
      "schedule": "0 10 * * *"
    }
  ]
}
```

**Job** : Relance des clients inactifs (>30 jours sans visite) par push notification.
**Frequence** : Tous les jours a 10h UTC.
**Auth** : Verifie le header `Authorization: Bearer CRON_SECRET`.

## Supabase

### Projet

- **Region** : (a verifier dans le dashboard Supabase)
- **Base de donnees** : PostgreSQL avec RLS active
- **Auth** : Email/Password pour les commercants, OTP email pour les clients

### Migrations

Les migrations sont dans `supabase/migrations/`. Les appliquer via le dashboard Supabase (SQL Editor) ou le CLI Supabase.

### RLS (Row Level Security)

Toutes les tables ont RLS active. Politiques principales :
- Tables commercant : `business_id = auth.uid()`
- Tables publiques (push_subscriptions, pwa_visits) : Acces uniquement via service role
- Tables Wallet : Pas de RLS (protocole Apple)

### Template email OTP

Configurer dans Supabase > Authentication > Email Templates :

```html
<h2>Votre code de connexion Fidelizy</h2>
<p>Your code is: {{ .Token }}</p>
<p>Ce code expire dans 10 minutes.</p>
<p>Si vous n'avez pas demande ce code, ignorez cet email.</p>
```

Le texte "Your code is:" doit rester en anglais pour le support autocomplete iOS/Android.

Voir [SUPABASE_EMAIL_TEMPLATE.md](./SUPABASE_EMAIL_TEMPLATE.md) pour les details.

## Apple Wallet

### Certificats requis

1. **Pass Type ID** : Creer dans Apple Developer > Certificates, Identifiers & Profiles > Pass Type IDs
2. **Certificat de signature** : Generer un certificat pour le Pass Type ID
3. **WWDR Certificate** : Telecharger le certificat intermediaire Apple (G4)
4. **Encoder en base64** : Les 3 certificats doivent etre encodes en base64 pour les variables d'environnement Vercel

### Web Service URL

Le pass Apple pointe vers `https://fidelizy.vercel.app/api/wallet/v1/` pour :
- Enregistrement/desenregistrement des appareils
- Telechargement des passes mis a jour
- Logs d'erreur

## Securite en production

### Headers HTTP

Configures dans `next.config.ts` (appliques a toutes les routes) :
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=(), geolocation=()`

### Rate limiting

15 limiters Upstash protegent toutes les routes sensibles. Voir [api-contracts.md](./api-contracts.md) pour le detail.

### Checklist deploiement

- [ ] Variables d'environnement configurees dans Vercel
- [ ] Migrations SQL appliquees dans Supabase
- [ ] Template email OTP configure dans Supabase Auth
- [ ] Certificats Apple Wallet encodes et deployes
- [ ] Cles VAPID generees et deployes
- [ ] CRON_SECRET defini pour les cron jobs
- [ ] RLS active sur toutes les tables
- [ ] Verifier que le domaine est configure dans Supabase Auth > URL Configuration
