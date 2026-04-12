# Izou — Vue d'ensemble du projet

> Genere le : 2026-03-23 | Scan exhaustif

## Resume

**Izou** (domaine : fidelizy) est une plateforme de fidelisation client tout-en-un destinee aux commercants de proximite. L'application permet de creer et gerer des cartes de fidelite digitales (tampons ou points), d'integrer Apple Wallet, de gamifier l'experience client (roue de la fortune, missions, parrainages) et d'envoyer des notifications push.

Le MVP est fonctionnel et deploye en production sur Vercel.

## Informations cles

| Attribut | Valeur |
|----------|--------|
| **Nom interne** | Izou |
| **Domaine** | fidelizy |
| **URL production** | https://fidelizy.vercel.app |
| **Type de depot** | Monolith |
| **Type de projet** | Application web full-stack (Next.js App Router) |
| **Langage principal** | TypeScript 5 |
| **Framework** | Next.js 16.1.6 + React 19.2.3 |
| **Base de donnees** | Supabase (PostgreSQL + RLS) |
| **Deploiement** | Vercel (auto-deploy depuis main) |
| **Dernier commit** | 9 mars 2026 |

## Stack technique

| Categorie | Technologie | Version |
|-----------|-------------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| UI | React | 19.2.3 |
| Langage | TypeScript | 5 |
| CSS | Tailwind CSS | 4 |
| Auth + DB | Supabase (Auth, PostgreSQL, RLS) | 2.98.0 |
| Rate limiting | Upstash Redis (@upstash/ratelimit) | 2.0.8 |
| QR Code | html5-qrcode (scan) + qrcode.react (generation) | 2.3.8 / 4.2.0 |
| Icones | Lucide React | 0.577.0 |
| Charts | Recharts | 3.7.0 |
| Apple Wallet | node-forge + JSZip (.pkpass) | 1.3.3 / 3.10.1 |
| Push web | web-push (VAPID) | 3.6.7 |
| PDF | jsPDF | 4.2.0 |
| Deploiement | Vercel + Cron | — |

## Architecture

Application Next.js monolithique utilisant l'App Router. Le frontend (pages React) et le backend (API routes) cohabitent dans le dossier `app/`. Pas de separation client/serveur distincte.

- **Frontend** : Pages React (Server + Client Components) dans `app/`
- **Backend** : 45 API routes dans `app/api/`
- **Base de donnees** : Supabase PostgreSQL avec RLS
- **Utilitaires** : `lib/` (Supabase clients, wallet, push, rate limiting, referral)
- **Middleware** : Protection des routes dashboard via `middleware.ts`
- **PWA** : Service Worker + manifest dynamique par carte
- **Pattern architectural** : Component-based avec API routes serverless

## Fonctionnalites principales

### Cote client
- Authentification par OTP email (via telephone)
- Carte de fidelite digitale (tampons ou points)
- QR code personnel + code court
- Integration Apple Wallet avec push notifications
- PWA installable avec manifest dynamique
- Historique des transactions
- Systeme de paliers de recompenses (mode points)
- Missions gamifiees (avis Google, profil, visites, parrainage)
- Roue de la fortune
- Systeme de parrainage avec code unique

### Cote commercant
- Inscription/connexion (email + mot de passe)
- Dashboard avec 8 KPIs
- Scanner QR code camera + saisie manuelle
- Gestion des clients (filtres, recherche, tri, export CSV)
- Detail client avec ajout/retrait de tampons/points
- Configuration de la gamification (surprises, roue, missions)
- Notifications push broadcast
- Templates metier (Cafe, Restaurant, Boulangerie)
- Parametres du programme de fidelite

## Chiffres du projet

| Metrique | Valeur |
|----------|--------|
| Fichiers TypeScript | ~81 |
| Routes API | 45 endpoints |
| Pages frontend | 10 pages |
| Composants | 28 (8 serveur, 20 client) |
| Migrations SQL | 7 |
| Rate limiters | 15 |
| Modeles de donnees | 14 entites |
| Variables d'environnement | 17 |
| Commits | ~30 (5-9 mars 2026) |

## Documentation associee

- [Architecture](./architecture.md)
- [Arbre source](./source-tree-analysis.md)
- [Contrats API](./api-contracts.md)
- [Modeles de donnees](./data-models.md)
- [Inventaire des composants](./component-inventory.md)
- [Guide de developpement](./development-guide.md)
- [Guide de deploiement](./deployment-guide.md)
- [Etat du projet (original)](./PROJET_STATE.md)
- [Audit de securite](../SECURITY_AUDIT.md)
