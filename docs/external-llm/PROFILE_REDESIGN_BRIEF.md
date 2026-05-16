# Brief — Refonte Profil Client P1 (Story 4.7 v2)

> **Objectif :** Refondre la page Profil client `/me/profile` selon le Figma envoyé 2026-05-07 (P1 + 5 sub-screens + 6 modals + avatar uploadable + personnalisation carte).
> **Statut actuel :** Story 4.7 livrée par Agent #2 le 2026-05-05 mais **incomplète** vs Figma (stub minimal : prénom + 2 boutons RGPD + logout).
> **Format de retour attendu :** PR markdown avec contenu complet de chaque fichier à créer + diff pour les modifs.
> **Effort estimé :** 10-14 commits / 3-5 sessions.

## Contexte du gap

### Existant (audit 2026-05-07)
- `app/me/profile/page.tsx` — fetch customer + render ProfileClient
- `app/me/profile/ProfileClient.tsx` (~352 lignes) — page mono avec :
  - Form Prénom (uniquement, pas de Nom)
  - Email + téléphone read-only
  - Bouton "Exporter mes données" (download direct ZIP)
  - Bouton "Supprimer mon compte" (modal 1-step)
  - Bouton "Se déconnecter" (action directe)
- `Customer` type a `last_name: string | null` en DB mais pas exposé ni éditable dans l'UI
- Aucun avatar, aucun sub-screen, aucune personnalisation carte
- Aucun toast unifié (messages inline dans le composant)

### Cible (Figma 2026-05-07)
Voir les screenshots fournis par le user. Page `Mon profil` avec :
1. Form Prénom + Nom + Email (avec validation email format)
2. Avatar circulaire avec icône caméra → modal "Changer ma photo"
3. Bouton "Annuler" + "Enregistrer" (form footer)
4. Section RÉGLAGES (menu list 6 items) :
   - Notifications
   - Confidentialité & données
   - Aide & support
   - Envoyer un feedback
   - Sécurité
   - Ma carte (personnaliser)
5. Bouton "Se déconnecter" (centré)
6. Bouton "Supprimer mon compte" (rouge, centré)
7. Footer "Version 1.0.0 — Pilote"

---

## Périmètre détaillé

### 1. Migration DB

**Fichier à créer :** `supabase/migrations/20260507_profile_p1_redesign.sql`

```sql
-- Ajouts à la table customers pour Story 4.7 v2
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS card_color text NOT NULL DEFAULT 'violet'
    CHECK (card_color IN ('violet', 'orange', 'jaune', 'corail', 'vert'));

-- last_name existe déjà en DB (vérifié dans lib/types.ts:34)

COMMENT ON COLUMN public.customers.avatar_url IS
  'URL Supabase Storage du customer-avatar uploadé. Path: customer-avatars/{customer_id}/avatar.{ext}';
COMMENT ON COLUMN public.customers.notification_prefs IS
  'Prefs notif client (jsonb) — clés : push_enabled, stamps_enabled, rewards_enabled, campaigns_enabled, referrals_enabled (booleans).';
COMMENT ON COLUMN public.customers.card_color IS
  'Couleur de la carte choisie par le client (Story 4.7.5). Override le noir #0F172A par default. 5 valeurs autorisées.';

-- Nouvelle table feedback (modal envoyer feedback)
CREATE TABLE IF NOT EXISTS public.customer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

-- Bucket Supabase Storage à créer manuellement via dashboard ou CLI :
-- - Name: customer-avatars
-- - Public: false
-- - RLS: similar to business-logos (owner write, public read)
```

**Storage bucket à créer (manuellement via dashboard Supabase) :** `customer-avatars`
- Private + RLS public-read
- Path : `{customer_id}/avatar.{ext}`
- Max size : 2 MB
- MIME : `image/png`, `image/jpeg`, `image/webp`

### 2. Endpoints API à créer/modifier

**A. POST + DELETE `/api/me/avatar`**
Path : `app/api/me/avatar/route.ts`
- Auth : cookie SSR client
- Reuse pattern : `app/api/business/upload-asset/route.ts` (logo upload)
- Validate MIME + size
- Upload to bucket `customer-avatars`, path `{customer_id}/avatar.{ext}`
- Cleanup old avatars before new upload (`storage.list().filter().remove()`)
- UPDATE `customers.avatar_url` avec public URL + cache-bust `?v={ts}`
- Rate-limit : `cardWriteLimiter`

**B. PATCH `/api/me/notification-prefs`**
Path : `app/api/me/notification-prefs/route.ts`
- Body Zod-validated :
```typescript
const schema = z.object({
  push_enabled: z.boolean().optional(),
  stamps_enabled: z.boolean().optional(),
  rewards_enabled: z.boolean().optional(),
  campaigns_enabled: z.boolean().optional(),
  referrals_enabled: z.boolean().optional(),
})
```
- Merge avec les prefs existantes : `{ ...current, ...body }`
- Rate-limit : `profileUpdateLimiter`

**C. PATCH `/api/me/card-color`**
Path : `app/api/me/card-color/route.ts`
- Body : `{ color: 'violet' | 'orange' | 'jaune' | 'corail' | 'vert' }` (Zod enum)
- UPDATE `customers.card_color`
- Rate-limit : `profileUpdateLimiter`

**D. POST `/api/me/feedback`**
Path : `app/api/me/feedback/route.ts`
- Body : `{ message: string (min: 10, max: 1000) }`
- INSERT dans `customer_feedback`
- Optionnel : envoyer un email à `contact@izou.fr` via Supabase Edge Function ou Resend
- Rate-limit : 3/heure par customer

**E. PATCH `/api/me/profile` (existante, à étendre)**
Body actuel : `{ first_name }`. Ajouter : `last_name`. Validation Zod.

**F. POST `/api/me/email-change` (P1.4 Sécurité)**
Path : `app/api/me/email-change/route.ts`
- Body : `{ new_email: string, password?: string }`
- Trigger Supabase Auth `updateUser({ email })` + envoi email confirmation
- Rate-limit : `profileUpdateLimiter`

**G. POST `/api/me/password-change` (P1.4 Sécurité)**
Path : `app/api/me/password-change/route.ts`
- Body : `{ current_password, new_password }`
- Vérifier current via Supabase signIn, puis updateUser({ password })
- Rate-limit strict : `merchantOtpLimiter` ou créer `passwordChangeLimiter`

**H. POST `/api/me/sessions/revoke` (P1.4 Sécurité)**
- Pour invalider les sessions actives (usage : "déconnecter de tous les appareils")

### 3. Refonte page principale `/me/profile`

**Modifier** `app/me/profile/ProfileClient.tsx` (réécrire ~80% du fichier).

Structure attendue (pseudo-code) :

```tsx
'use client'
export default function ProfileClient({ customer }: Props) {
  // States
  const [firstName, setFirstName] = useState(customer.first_name)
  const [lastName, setLastName] = useState(customer.last_name ?? '')
  const [email, setEmail] = useState(customer.email ?? '')
  const [avatarUrl, setAvatarUrl] = useState(customer.avatar_url)

  // Modals state
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0)
  const [exportModalOpen, setExportModalOpen] = useState(false)

  // Toast state (réutiliser composant Toast existant)
  const [toast, setToast] = useState<{ variant; title; message } | null>(null)

  return (
    <>
      <TopBarClient />

      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        <h1>Mon profil</h1>
        <p className="text-tertiary">Gérez vos informations personnelles.</p>

        {/* Form card */}
        <Card>
          <Input label="Prénom" value={firstName} onChange={setFirstName} />
          <Input label="Nom" value={lastName} onChange={setLastName} />
          <Input label="Email" type="email" value={email} onChange={setEmail} icon={Mail01} />

          {/* Avatar */}
          <Avatar
            url={avatarUrl}
            onChangeRequest={() => setAvatarModalOpen(true)}
          />

          {/* Footer actions */}
          <div className="flex gap-2 justify-end">
            <Button color="secondary" onClick={handleReset}>Annuler</Button>
            <Button color="primary" onClick={handleSave}>Enregistrer</Button>
          </div>
        </Card>

        {/* Section RÉGLAGES */}
        <SectionTitle>RÉGLAGES</SectionTitle>
        <MenuList>
          <MenuItem icon={Bell01} label="Notifications" href="/me/profile/notifications" />
          <MenuItem icon={Shield01} label="Confidentialité & données" href="/me/profile/privacy" />
          <MenuItem icon={HelpCircle} label="Aide & support" href="/me/profile/help" />
          <MenuItem icon={MessageCircle01} label="Envoyer un feedback" onClick={() => setFeedbackModalOpen(true)} />
          <MenuItem icon={Lock01} label="Sécurité" href="/me/profile/security" />
          <MenuItem icon={CreditCard02} label="Ma carte (personnaliser)" href="/me/profile/card-customization" />
        </MenuList>

        <button onClick={() => setLogoutModalOpen(true)} className="text-center w-full">
          Se déconnecter
        </button>

        <button onClick={() => setDeleteStep(1)} className="text-center w-full text-error-primary">
          Supprimer mon compte
        </button>

        <p className="text-xs text-quaternary text-center">Version 1.0.0 — Pilote</p>
      </main>

      <BottomTabBarClient />

      {/* Modals */}
      <AvatarUploadModal isOpen={avatarModalOpen} onClose={...} onUploaded={...} />
      <FeedbackModal isOpen={feedbackModalOpen} onClose={...} />
      <LogoutModal isOpen={logoutModalOpen} onConfirm={handleLogout} onCancel={...} />
      <DeleteAccountStep1Modal isOpen={deleteStep === 1} onConfirm={() => setDeleteStep(2)} onCancel={...} />
      <DeleteAccountStep2Modal isOpen={deleteStep === 2} onConfirm={handleDelete} onCancel={...} />

      {/* Toast */}
      {toast && <Toast {...toast} />}
    </>
  )
}
```

### 4. Sub-screens à créer (5)

#### `/me/profile/notifications/page.tsx` (P1.1)
- TopBar avec ArrowLeft retour `/me/profile`
- Section "GÉNÉRAL" : toggle "Recevoir les notifications push"
- Section "TYPES DE NOTIFICATIONS" : 4 toggles (Nouveau tampon, Récompense disponible, Campagnes, Parrainage)
- Composant ToggleSwitch d'Untitled UI ou custom
- Sur change : PATCH `/api/me/notification-prefs`
- Toast "Préférences enregistrées" sur succès

#### `/me/profile/privacy/page.tsx` (P1.2)
- TopBar
- Section "MES DONNÉES" :
  - "Exporter mes données" → modal export par email
  - "Historique des consentements" → liste des consentements donnés
- Section "DOCUMENTS LÉGAUX" : liens vers `/cgu`, `/privacy`
- Section "SUPPRESSION DE COMPTE" : carte rouge avec CTA "Supprimer mon compte" → modal 2-step

#### `/me/profile/help/page.tsx` (P1.3)
- TopBar
- Section "QUESTIONS FRÉQUENTES" : Accordion 4 items (Comment fonctionne ma carte ?, Qu'est-ce que le parrainage ?, Mon commerçant n'a pas Izou, Récupérer une carte perdue)
- Section "NOUS CONTACTER" :
  - "Envoyer un e-mail à l'équipe" → mailto:contact@izou.fr
  - "Envoyer un feedback depuis l'app" → modal feedback

#### `/me/profile/security/page.tsx` (P1.4)
- TopBar
- Section "AUTHENTIFICATION" :
  - "Changer mon e-mail" (affiche current, → page enfant ou modal)
  - "Changer mon mot de passe" (avec date dernière modif)
- Section "APPAREILS CONNECTÉS" :
  - "Sessions actives" → liste devices avec bouton "Révoquer"

#### `/me/profile/card-customization/page.tsx` (P1.5)
- TopBar avec ArrowLeft "Personnaliser ma carte"
- Texte explicatif "Choisissez la couleur de votre carte fidélité. Elle apparaîtra partout où votre carte est visible."
- Preview `<LoyaltyCardVisual customerName=... cardColor={selectedColor} ...>`  (réutiliser composant existant, mais étendu pour accepter `cardColor`)
- Palette 5 boutons radio circulaires (violet, orange, jaune, corail, vert) — l'actif a un check ✓
- Bouton "Enregistrer" → PATCH `/api/me/card-color` + toast + retour profil

### 5. Modals à créer (6)

Tous dans `app/me/profile/components/` ou `components/client/profile/` :

#### `<AvatarUploadModal>`
- Cercle vert succès + icône camera
- Titre "Changer ma photo"
- Texte "Choisissez comment mettre à jour votre photo de profil."
- Boutons : "Prendre une photo" (primary) / "Annuler" (secondary)
- Action "Prendre une photo" → ouvre input file capture="user" + crop optionnel via `react-easy-crop` (déjà installé) → upload via POST `/api/me/avatar`

#### `<FeedbackModal>`
- Cercle vert succès
- Titre "Envoyer un feedback"
- Texte "Aidez-nous à améliorer Izou. Votre avis est précieux."
- Textarea (autoresize, max 1000 chars)
- Boutons : "Envoyer" (primary) / "Annuler" (secondary)
- POST `/api/me/feedback`
- Toast "Merci pour votre feedback ! Nous l'avons bien reçu."

#### `<ExportDataModal>`
- Cercle vert succès
- Titre "Exporter mes données"
- Texte explicatif
- Boutons : "Envoyer par e-mail" (primary) / "Annuler" (secondary)
- Action : POST `/api/me/export` (modifier le current pour envoyer par email au lieu de download direct)

#### `<LogoutModal>`
- Cercle warning jaune ⚠
- Titre "Se déconnecter ?"
- Texte "Vous devrez vous reconnecter pour retrouver votre carte et vos tampons."
- Boutons : "Se déconnecter" (primary) / "Annuler" (secondary)
- Action : `supabase.auth.signOut()` + redirect `/`

#### `<DeleteAccountStep1Modal>`
- Cercle danger rouge ⚠
- Titre "Supprimer mon compte ?"
- Texte "Cette action est définitive. Votre carte, vos tampons et l'historique de vos récompenses seront supprimés."
- Boutons : "Supprimer définitivement" (destructive primary rouge) / "Annuler" (secondary)
- Action : passe à Step 2

#### `<DeleteAccountStep2Modal>` (dev note Figma : input "SUPPRIMER" strict)
- Cercle danger rouge ⚠
- Titre "Confirmation finale"
- Texte "Tapez « SUPPRIMER » ci-dessous pour confirmer la suppression définitive. Cette action ne peut pas être annulée."
- **Input text** placeholder "Tapez SUPPRIMER"
- Bouton "Supprimer définitivement" (destructive primary rouge) — **disabled** sauf si input === 'SUPPRIMER' strict (case-sensitive)
- Bouton "Annuler"
- Action confirm : POST `/api/me/delete` + signOut + redirect `/`

### 6. Toasts à standardiser

Réutiliser `components/client/Toast.tsx` (existant 4.3.c, 3 variants : info / success / error).

4 cas attendus selon Figma :
- 🔵 **Info "Déconnecté · À bientôt sur Izou."** (post-logout, 3s)
- 🔴 **Error "Une erreur est survenue · Veuillez réessayer · Action : Réessayer"** (action button optionnel)
- 🟢 **Success "Merci pour votre feedback ! · Nous l'avons bien reçu."** (post-send feedback)
- 🟢 **Success "Profil enregistré · Vos informations ont été mises à jour."** (post-save form)

### 7. Wiring LoyaltyCardVisual avec cardColor

**Modifier** `components/dashboard/LoyaltyCardVisual.tsx` :
- Ajouter prop `cardColor?: 'violet' | 'orange' | 'jaune' | 'corail' | 'vert'`
- Mapping `cardColor` → `bg-color` du côté gauche (override `#0F172A` noir actuel)

```typescript
const CARD_COLOR_MAP = {
  violet: '#7F56D9',
  orange: '#F79009',
  jaune: '#FAC515',
  corail: '#F97066',
  vert: '#17B26A',
}

// Apply on left side:
style={{ backgroundColor: cardColor ? CARD_COLOR_MAP[cardColor] : '#0F172A' }}
```

**Brancher** dans `CardTab.tsx` via `customer.card_color` (passer la prop).

---

## Ordre de commits suggéré

1. **`feat(4.7-v2): migration DB profile P1 (avatar, prefs, card_color, feedback table)`**
2. **`feat(4.7-v2): endpoint POST/DELETE /api/me/avatar`**
3. **`feat(4.7-v2): endpoint PATCH /api/me/notification-prefs`**
4. **`feat(4.7-v2): endpoint PATCH /api/me/card-color`**
5. **`feat(4.7-v2): endpoint POST /api/me/feedback`**
6. **`feat(4.7-v2): endpoints sécurité (email/password change, sessions revoke)`**
7. **`feat(4.7-v2): refonte ProfileClient — form Prénom/Nom/Email + avatar + menu Réglages`**
8. **`feat(4.7-v2): sub-screen P1.1 Notifications`**
9. **`feat(4.7-v2): sub-screen P1.2 Confidentialité`**
10. **`feat(4.7-v2): sub-screen P1.3 Aide & support`**
11. **`feat(4.7-v2): sub-screen P1.4 Sécurité`**
12. **`feat(4.7-v2): sub-screen P1.5 Personnaliser ma carte + LoyaltyCardVisual cardColor`**
13. **`feat(4.7-v2): modals (avatar, feedback, export, logout, delete 2-step strict)`**
14. **`feat(4.7-v2): toasts unifiés post-action`**

---

## Composants/utils à réutiliser

- `components/dashboard/AssetUploader.tsx` — peut être généralisé pour `kind='avatar'` (cercle 1:1, ratio 1)
- `components/client/Toast.tsx` — 3 variants déjà prêts
- `components/ui/base/buttons/button.tsx` — Button Untitled UI
- `components/ui/base/input/input.tsx` — Input Untitled UI
- `lib/supabase/server.ts` — createClient SSR
- `lib/supabase/service.ts` — service_role pour storage upload
- `lib/errors.ts` — AppError + withErrorHandler
- `lib/ratelimit.ts` — limiters
- Pattern endpoint upload : `app/api/business/upload-asset/route.ts` (à dupliquer pour avatar)

## Format de retour attendu

Pour chaque fichier à créer/modifier :

```markdown
### path/to/file.ts (CREATE)

\`\`\`typescript
[contenu complet]
\`\`\`

### path/to/file.ts (MODIFY lines X-Y)

\`\`\`diff
- ancien
+ nouveau
\`\`\`
```

**Section "Questions ouvertes"** en fin pour les choix ambigus.

---

## Out of scope du brief

- Animations / micro-interactions custom (Lottie, framer-motion) — peut être ajouté plus tard
- Gestion multi-langue (i18n) — pas pour le pilote
- Mode sombre — `feedback_no_os_dark_mode` interdit `prefers-color-scheme`
- Test E2E Playwright des nouveaux flows — sera fait dans un autre brief
