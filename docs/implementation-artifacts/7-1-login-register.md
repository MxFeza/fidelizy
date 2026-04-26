# Story 7.1 — Login / Register / Onboarding / Welcome / Forgot-password

**Epic :** 7 (Auth & Onboarding commercant) · **Taille :** M · **Statut :** in-progress
**Figma :** nodes 9899:586 (overview), 9900:1063/9899:609 (register DT/mobile), 9900:1034/9899:587 (login DT/mobile), 10507:1637/9913:1335 (onboarding DT/mobile), 10819:1997 (welcome), 10536:2467/10536:2629 (OTP — reserve pour une future story de 2FA)

## Fichiers livres

| Fichier | Role |
|---------|------|
| `app/dashboard/(auth)/AuthLayout.tsx` | Layout partage split desktop 50/50 + hero mobile |
| `app/dashboard/(auth)/login/page.tsx` | **REECRIT** — email + password + remember me + forgot link (plus d'OTP au login) |
| `app/dashboard/(auth)/register/page.tsx` | **REECRIT** — business name + email + password, redirige vers onboarding |
| `app/dashboard/(auth)/onboarding/page.tsx` | **NOUVEAU** — J3 choix commerce (Café/Restau/Boulangerie/Snack) |
| `app/dashboard/(auth)/welcome/page.tsx` + `WelcomeClient.tsx` | **NOUVEAU** — celebration post-setup |
| `app/dashboard/(auth)/forgot-password/page.tsx` | **NOUVEAU** — flow reset via email link Supabase |
| `app/dashboard/(auth)/reset-password/page.tsx` | **NOUVEAU** — set new password apres clic lien email |
| `components/ui/base/checkbox/checkbox.tsx` | **NOUVEAU** — copie du Checkbox Untitled UI |
| `public/Izou Assets/auth-*.{webp,jpg,png}` | 3 images renommees proprement |

## Parcours utilisateur

```
Visitor
 └── /register ─────────► Enter business + creds ─► Create auth user + business row
      └── /onboarding ──► Select business type ───► Update stamps_reward
           └── /welcome ► Celebrate + next steps ─► /dashboard

Visitor
 └── /login ────────────► Enter email + password ─► /dashboard

Visitor
 └── /forgot-password ──► Enter email ────────────► Supabase sends reset link
      └── Email click ──► /reset-password?token=* ► Set new password ─► /dashboard
```

## Decisions integrees

| Decision | Source |
|----------|--------|
| **Pas de social login** (Google/Facebook/Apple) | User 2026-04-22 "on fait plus tard". Designs Figma montrent les boutons mais on les cache pour cette story. |
| **Pas d'OTP au login** | User 2026-04-22 "pas de OTP au debut". Le flow OTP reste dans l'API (`merchant-send-otp` etc.) pour une future story 2FA. |
| **Forgot password via lien email** (pas 6-digit code) | Pragmatique. Utilise le built-in Supabase `resetPasswordForEmail` → simpler, plus robuste. Le Figma montre des ecrans OTP qui correspondent plutot a une 2FA future. |
| **Se souvenir de moi** | Checkbox present mais **decoratif** pour cette story. Supabase persist deja la session par defaut en localStorage. |
| **Icone Café = Heart** | @untitledui/icons free n'a pas de Coffee/Mug. Heart = warmth/comfort comme substitution. A changer si @untitledui-pro est souscrit. |
| **Pas de confirmation email bloquante** au register | Figma passe direct register → onboarding → dashboard. Suppose Supabase auto-confirm ou utilisateur valide apres coup. |

## Differences avec Figma

- **Social logins** : masques
- **Testimonial photo Marie sur desktop register** : overlay gradient remplace par overlay `bg-black/35` solide (regle "aucun degrade")
- **Images mobile = crop desktop balloon image** : meme image `auth-balloons-landscape.webp` avec `object-cover object-top` pour cropper le haut (ballon) sur mobile. Si user veut un asset dedie, je peux l'ajouter plus tard.

## Acceptance criteria

- [x] Login fonctionne avec email + password Supabase
- [x] Register cree user + business row avec couleur brand violet (#7F56D9)
- [x] Register redirige vers `/onboarding`
- [x] Onboarding update `stamps_reward` selon type commerce
- [x] Onboarding redirige vers `/welcome`
- [x] Welcome affiche prenom du commercant + QR download + lien dashboard
- [x] Forgot-password envoie email Supabase + feedback visuel
- [x] Reset-password met a jour le password via Supabase
- [x] Tous tokens semantiques (aucun `bg-indigo-*`, aucun gradient)
- [x] Logo reel SVG noir utilise sur tous les ecrans
- [x] Responsive mobile ↔ desktop teste

## Test manuel

1. `/dashboard/register` → remplir form → redirige vers `/onboarding`
2. `/dashboard/onboarding` → clic sur Restaurant → "Continuer" → redirige vers `/welcome`
3. `/dashboard/welcome` → voir "Bienvenue chez Izou, [Prenom]!" → clic "Aller au tableau de bord"
4. Logout → `/dashboard/login` → email + password → dashboard
5. `/dashboard/forgot-password` → email → "Vérifiez vos emails" → recevoir lien → clic → `/reset-password` → new pwd → dashboard

## Dette documentee

- Social login providers (Google/Facebook/Apple) — story dediee future
- OTP 2FA (2 ecrans Figma restants) — story future
- Icone Coffee custom — soit @untitledui-pro, soit SVG inline custom
- Balloon mobile dedie — si user veut pas de crop de l'image desktop

## Next story

7.2 Onboarding choix metier — **partiellement couverte ici** (J3 choix commerce implementee). A elargir : templates metier pre-remplis avec recompenses+paliers specifiques par type.
Puis 7.3 OTP commercant (2FA optionnel).
