# Izou — Inventaire des composants

> Genere le : 2026-03-23 | Scan exhaustif | 28 composants

## Vue d'ensemble

L'application utilise 28 composants React repartis en 8 Server Components et 20 Client Components. Pas de state management global — tout est en `useState` local.

**Conventions** :
- Server Components : chargement SSR des donnees (Supabase), pas d'interactivite
- Client Components (`'use client'`) : interactivite, hooks, evenements
- Pattern courant : Page (Server) → Client wrapper (Client)
- Styling : Tailwind CSS 4, responsive mobile-first

---

## Pages publiques (client)

### Page d'accueil — `app/page.tsx`
| Attribut | Valeur |
|----------|--------|
| Type | Client Component |
| Route | `/` |
| State | step ('code'\|'phone'\|'email'\|'otp'), code, phone, email, businessId, loading, error |
| API calls | GET /api/business, POST /api/auth/send-otp, POST /api/auth/add-email, POST /api/auth/verify-otp |
| Description | Formulaire multi-etapes d'authentification client (code commerce → phone → email → OTP) |

### Carte fidelite — `app/card/[cardId]/page.tsx` + `CardPageClient.tsx`
| Attribut | Valeur |
|----------|--------|
| Type | Server (page) + Client (CardPageClient) |
| Route | `/card/[cardId]` |
| Props SSR | card, business, transactions, rewardTiers |
| State client | activeTab, install events, push banner, confetti, missions, wheel, profile form |
| API calls | POST /api/pwa-visit, GET /api/missions, GET /api/card/[cardId]/live (polling 8s), POST /api/push/subscribe, POST /api/missions/complete, POST /api/wheel/spin, POST /api/card/claim-reward, POST /api/card/update-profile |
| Description | Page principale du client — tampons/points, QR code, code court, historique, missions, roue, Apple Wallet, install PWA |

### Inscription — `app/join/[businessId]/page.tsx` + `JoinForm.tsx`
| Attribut | Valeur |
|----------|--------|
| Type | Server (page) + Client (JoinForm) |
| Route | `/join/[businessId]` |
| Props SSR | business (nom, couleur, type fidelite) |
| State client | firstName, phone, email, referralCode, step, loading, error |
| API calls | POST /api/join, POST /api/auth/send-otp, POST /api/auth/verify-otp |
| Description | Formulaire d'inscription nouveau client avec OTP |

### Recuperation — `app/recover/page.tsx` + `RecoverForm.tsx`
| Attribut | Valeur |
|----------|--------|
| Type | Server (page) + Client (RecoverForm) |
| Route | `/recover` |
| State client | step, phone, email, maskedEmail, cards, loading, error |
| API calls | POST /api/auth/send-otp, POST /api/auth/add-email, POST /api/auth/verify-otp |
| Description | Recuperation de cartes par telephone + OTP |

---

## Dashboard commercant — Auth

### Login — `app/dashboard/(auth)/login/page.tsx`
| Type | Client Component | Route | `/dashboard/login` |
| State | email, password, loading, error |
| Auth | Supabase `auth.signInWithPassword()` |

### Register — `app/dashboard/(auth)/register/page.tsx`
| Type | Client Component | Route | `/dashboard/register` |
| State | email, password, businessName, loading, error |
| Auth | Supabase `auth.signUp()` + insert business + generate short_code |

---

## Dashboard commercant — Pages protegees

### Layout — `app/dashboard/(protected)/layout.tsx`
| Type | Server Component |
| Auth | Redirect si non authentifie |
| Enfants | Sidebar (desktop) + MobileHeader + BottomNav (mobile) |

### Dashboard Home — `page.tsx` + `DashboardClient.tsx`
| Attribut | Valeur |
|----------|--------|
| Type | Server (page) + Client (DashboardClient) |
| Route | `/dashboard` |
| Props SSR | business, totalCustomers, visitsToday, recentScans |
| State client | scannerModal, manualInput, kpis, weekData, topClients |
| API calls | GET /api/dashboard/kpis, GET /api/dashboard/visits-week, GET /api/dashboard/top-clients |
| Libs | Recharts (BarChart), qrcode (PDF export) |
| Description | KPIs (8 indicateurs), graphique visites semaine, top 3 clients, scanner QR, saisie manuelle, export PDF |

### Clients — `clients/page.tsx` + `ClientsClient.tsx`
| Attribut | Valeur |
|----------|--------|
| Type | Server (page) + Client (ClientsClient) |
| Route | `/dashboard/clients` |
| Props SSR | clients, business, stats (active, inactive, lost, returnRate) |
| State client | search, statusFilter, sortKey, sortDir, page |
| Features | Filtres statut (tous/actif/a_risque/inactif/perdu), recherche, tri, pagination, export CSV |

### Detail client — `clients/[id]/page.tsx` + `ClientDetailClient.tsx`
| Attribut | Valeur |
|----------|--------|
| Type | Server (page) + Client (ClientDetailClient) |
| Route | `/dashboard/clients/[id]` |
| Props SSR | card + customer, business, transactions, rewardTiers |
| State client | add/deduct forms, reset modal, claim modal, cooldown |
| API calls | POST /api/card/add, POST /api/card/deduct, POST /api/card/reset, POST /api/card/claim-reward |
| Description | Gestion complete d'une carte client — ajout/retrait, reset, claim, historique |

### Engagement — `engagement/page.tsx`
| Attribut | Valeur |
|----------|--------|
| Type | Client Component |
| Route | `/dashboard/engagement` |
| Features | Templates metier (Cafe/Restaurant/Boulangerie), config surprise, roue, missions (google_review, referral, profile, monthly_visits), segments roue, stats engagement |
| Description | Page de configuration gamification complete |

### Notifications — `notifications/page.tsx`
| Attribut | Valeur |
|----------|--------|
| Type | Client Component |
| Route | `/dashboard/notifications` |
| State | title, body, subscriberCount, sending, toast |
| API calls | GET/POST /api/push/broadcast |
| Description | Envoi de push notifications broadcast |

### Parametres — `settings/page.tsx`
| Attribut | Valeur |
|----------|--------|
| Type | Client Component |
| Route | `/dashboard/settings` |
| Features | Nom du commerce, couleur (presets), type fidelite (stamps/points), config stamps/points, paliers de recompenses |

### Profil — `profile/page.tsx` + `ProfileClient.tsx`
| Attribut | Valeur |
|----------|--------|
| Type | Server (page) + Client (ProfileClient) |
| Route | `/dashboard/profile` |
| Features | Changement email, changement mot de passe, deconnexion |

---

## Composants partages — `app/components/`

### OTPInput
| Fichier | `app/components/OTPInput.tsx` |
| Props | `length?: number (default 6), onComplete: (code) => void, disabled?: boolean` |
| Features | Auto-focus entre inputs, support paste, backspace, number-only, autoComplete="one-time-code" |

### QrCodeDisplay
| Fichier | `app/components/QrCodeDisplay.tsx` |
| Props | `value: string, size?: number` |
| Lib | qrcode.react (QRCodeSVG) |

### QrScanner
| Fichier | `app/components/QrScanner.tsx` |
| Props | `onClose: () => void, onSuccess: () => void` |
| State | status (scanning/processing/done/error), message |
| Lib | html5-qrcode |
| API | POST /api/scan |
| Description | Modal scanner QR camera pour le dashboard commercant |

### ShortCodeDisplay
| Fichier | `app/components/ShortCodeDisplay.tsx` |
| Props | `code: string` |
| Features | Affichage XXXX-XXXX, copie clipboard avec feedback visuel |

### RegisterSW
| Fichier | `app/components/RegisterSW.tsx` |
| Description | Enregistrement du Service Worker PWA (/sw.js) |

---

## Composants partages — `components/dashboard/`

### BottomNav
| Fichier | `components/dashboard/BottomNav.tsx` |
| Props | `businessName: string` |
| Display | Mobile uniquement (md:hidden) |
| Items | Scanner, Clients, Engagement, Settings, Profile |
| Icones | Lucide React |

### MobileHeader
| Fichier | `components/dashboard/MobileHeader.tsx` |
| Props | `businessName: string` |
| Display | Mobile uniquement (flex md:hidden) |

---

## Navigation — `app/dashboard/(protected)/Sidebar.tsx`
| Type | Client Component |
| Props | `businessName: string` |
| Links | Dashboard, Clients, Engagement, Notifications, Settings, Profile |
| Display | Desktop uniquement (hidden md:flex) |
| Detection | `usePathname()` pour lien actif |
