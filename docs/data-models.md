# Izou — Modeles de donnees

> Genere le : 2026-03-23 | Scan exhaustif | 14 entites | 7 migrations SQL

## Vue d'ensemble

La base de donnees est hebergee sur **Supabase PostgreSQL** avec **Row Level Security (RLS)** active sur toutes les tables. Le schema est defini a travers 7 fichiers de migration SQL dans `supabase/migrations/`.

Les types TypeScript correspondants sont dans `lib/types.ts`.

## Diagramme des relations

```
auth.users (Supabase Auth)
    |
    | 1:1 (businesses.id = auth.users.id)
    v
businesses ----< loyalty_cards >---- customers
    |                |
    |                |--- transactions
    |                |--- reward_claims
    |                |--- wheel_spins
    |                |--- mission_completions
    |                |--- referrals (referrer + referred)
    |                |--- pwa_visits
    |                |--- push_subscriptions
    |                |--- wallet_registrations (via serial_number = qr_code_id)
    |
    |----< reward_tiers
    |----< wheel_prizes
    |----< missions
```

## Tables detaillees

### 1. businesses

Commerce enregistre. Lie 1:1 avec `auth.users` (le `id` est le meme que l'uid Supabase Auth).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK, = auth.uid | Identifiant (meme que user auth) |
| email | text | | Email du commercant |
| business_name | text | NOT NULL | Nom du commerce |
| logo_url | text | nullable | URL du logo |
| primary_color | text | | Couleur principale (#hex) |
| secondary_color | text | nullable | Couleur secondaire |
| loyalty_type | text | 'stamps' \| 'points' | Type de programme |
| stamps_required | integer | | Nombre de tampons pour recompense |
| stamps_reward | text | | Description de la recompense tampons |
| points_per_euro | integer | | Points gagnes par euro |
| short_code | text | UNIQUE | Code court 6 chars (ex: ABC123) |
| is_active | boolean | | Commerce actif |
| gamification | jsonb | | Config gamification (voir ci-dessous) |
| created_at | timestamptz | | Date de creation |

**Structure `gamification` (jsonb)** :
```json
{
  "surprise_enabled": false,
  "surprise_probability": 0.2,
  "surprise_reward_type": "bonus_stamp",
  "surprise_reward_value": 1,
  "initial_stamps": 0,
  "goal_gradient_notification": true,
  "wheel_enabled": false,
  "wheel_cost_points": 10
}
```

**RLS** : `auth.uid() = id` (le commercant ne voit que son propre commerce)

---

### 2. customers

Client final. Pas de compte Supabase Auth — identifie par telephone.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | Identifiant |
| first_name | text | NOT NULL | Prenom |
| phone | text | NOT NULL | Telephone |
| email | text | nullable | Email (utilise pour OTP) |
| push_token | text | nullable | Token push (legacy) |
| created_at | timestamptz | | Date de creation |

---

### 3. loyalty_cards

Carte de fidelite — lie un client a un commerce.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | Identifiant |
| customer_id | uuid | FK → customers(id) | Client |
| business_id | uuid | FK → businesses(id) CASCADE | Commerce |
| current_stamps | integer | default 0 | Tampons actuels |
| current_points | integer | default 0 | Points actuels |
| total_visits | integer | default 0 | Nombre total de visites |
| last_visit_at | timestamptz | nullable | Derniere visite |
| qr_code_id | text | UNIQUE | UUID du QR code (identifiant public) |
| is_active | boolean | default true | Carte active |
| birthday | date | nullable | Anniversaire (ajout mission profil) |
| created_at | timestamptz | | Date de creation |

**RLS** : `business_id = auth.uid()`

---

### 4. transactions

Journal de toutes les operations (gain et debit).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | Identifiant |
| loyalty_card_id | uuid | FK → loyalty_cards(id) | Carte concernee |
| business_id | uuid | FK → businesses(id) | Commerce |
| type | text | 'earn' \| 'redeem' | Type d'operation |
| stamps_added | integer | nullable | Tampons ajoutes (negatif si retrait) |
| points_added | integer | nullable | Points ajoutes (negatif si retrait) |
| description | text | nullable | Description (ex: "Roue de la fortune", "Surprise +1") |
| created_at | timestamptz | | Date |

**RLS** : `business_id = auth.uid()`

---

### 5. reward_tiers

Paliers de recompenses (mode points uniquement).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | Identifiant |
| business_id | uuid | FK → businesses(id) CASCADE | Commerce |
| points_required | integer | NOT NULL | Points necessaires |
| reward_name | text | NOT NULL | Nom de la recompense |
| reward_description | text | nullable | Description |
| sort_order | integer | | Ordre d'affichage |
| created_at | timestamptz | | Date de creation |

**RLS** : `business_id = auth.uid()`

---

### 6. reward_claims

Recompenses echangees par les clients.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | Identifiant |
| loyalty_card_id | uuid | FK → loyalty_cards(id) | Carte |
| reward_tier_id | uuid | FK → reward_tiers(id) CASCADE | Palier echange |
| reward_name | text | | Nom de la recompense |
| points_spent | integer | | Points depenses |
| created_at | timestamptz | | Date |

---

### 7. wheel_prizes

Segments de la roue de la fortune (2-8 par commerce).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | Identifiant |
| business_id | uuid | FK → businesses(id) CASCADE | Commerce |
| label | text | NOT NULL | Libelle du segment |
| emoji | text | default '🎯' | Emoji du segment |
| probability | integer | NOT NULL | Probabilite (1-100) |
| reward_type | text | CHECK IN ('bonus_stamps', 'bonus_points', 'custom_reward') | Type de gain |
| reward_value | integer | default 1 | Valeur du gain |
| reward_description | text | nullable | Description du gain custom |
| sort_order | integer | default 0 | Ordre |
| created_at | timestamptz | | Date |

**RLS** : `business_id = auth.uid()`

---

### 8. wheel_spins

Historique des tours de roue.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | Identifiant |
| card_id | uuid | FK → loyalty_cards(id) CASCADE | Carte |
| business_id | uuid | FK → businesses(id) CASCADE | Commerce |
| points_spent | integer | NOT NULL | Points depenses |
| prize_id | uuid | FK → wheel_prizes(id) | Prix gagne |
| prize_label | text | NOT NULL | Libelle du prix |
| created_at | timestamptz | | Date |

**RLS** : `business_id = auth.uid()`
**Index** : `idx_wheel_spins_card`, `idx_wheel_spins_business`

---

### 9. missions

Templates de missions par commerce.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | Identifiant |
| business_id | uuid | FK → businesses(id) CASCADE | Commerce |
| template_key | text | NOT NULL | Cle template (google_review, referral, complete_profile, monthly_visits) |
| reward_points | integer | default 3 | Points gagnes |
| is_active | boolean | default true | Mission active |
| config | jsonb | default '{}' | Config specifique (ex: monthly_visits_target) |
| created_at | timestamptz | | Date |

**Contrainte unique** : `(business_id, template_key)`
**RLS** : `business_id = auth.uid()`
**Index** : `idx_missions_business`

---

### 10. mission_completions

Progres et completions des missions par les clients.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | Identifiant |
| card_id | uuid | FK → loyalty_cards(id) CASCADE | Carte |
| mission_id | uuid | FK → missions(id) CASCADE | Mission |
| proof_url | text | nullable | URL de preuve (avis Google) |
| status | text | CHECK IN ('completed', 'pending_review') | Statut |
| period | text | nullable | Periode (ex: "2026-03" pour monthly) |
| points_awarded | integer | NOT NULL | Points attribues |
| created_at | timestamptz | | Date |

**RLS** : Via JOIN sur missions (business_id = auth.uid())
**Index** : `idx_mission_completions_card`, `idx_mission_completions_mission`

---

### 11. referrals

Parrainages entre clients.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | Identifiant |
| referrer_card_id | uuid | FK → loyalty_cards(id) CASCADE | Carte du parrain |
| referred_card_id | uuid | FK → loyalty_cards(id) CASCADE | Carte du filleul |
| business_id | uuid | FK → businesses(id) CASCADE | Commerce |
| referrer_points_awarded | integer | default 0 | Points donnes au parrain |
| referred_points_awarded | integer | default 0 | Points donnes au filleul |
| created_at | timestamptz | | Date |

**Contrainte unique** : `(referred_card_id, business_id)`
**RLS** : `business_id = auth.uid()`
**Index** : `idx_referrals_business`, `idx_referrals_referrer`

---

### 12. pwa_visits

Visites journalieres via PWA (une par jour par carte).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| card_id | uuid | FK → loyalty_cards(id) CASCADE | Carte |
| visit_date | date | NOT NULL | Date de visite |
| created_at | timestamptz | | Date |

**Cle primaire** : `(card_id, visit_date)` (composite)
**RLS** : Active (acces via service role uniquement)
**Index** : `idx_pwa_visits_card`

---

### 13. push_subscriptions

Abonnements Web Push (VAPID).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | Identifiant |
| card_id | uuid | FK → loyalty_cards(id) CASCADE, NOT NULL | Carte |
| business_id | uuid | FK → businesses(id) CASCADE, NOT NULL | Commerce |
| subscription | jsonb | NOT NULL | Objet PushSubscription (endpoint, keys) |
| last_push_sent_at | timestamptz | nullable | Dernier push envoye |
| created_at | timestamptz | | Date |
| updated_at | timestamptz | | Mise a jour |

**Contrainte unique** : `(card_id, subscription->>'endpoint')`
**RLS** : Active (acces via service role uniquement)

---

### 14. wallet_registrations

Appareils Apple Wallet enregistres.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | uuid | PK | Identifiant |
| device_library_id | text | NOT NULL | ID librairie Apple |
| serial_number | text | NOT NULL | = qr_code_id de la carte |
| push_token | text | NOT NULL | Token APNs |

**Contrainte unique** : `(device_library_id, pass_type_id, serial_number)`

---

## Index de la base de donnees

| Index | Table | Colonnes |
|-------|-------|----------|
| idx_missions_business | missions | business_id |
| idx_mission_completions_card | mission_completions | card_id |
| idx_mission_completions_mission | mission_completions | mission_id |
| idx_referrals_business | referrals | business_id |
| idx_referrals_referrer | referrals | referrer_card_id |
| idx_pwa_visits_card | pwa_visits | card_id |
| idx_wheel_prizes_business | wheel_prizes | business_id |
| idx_wheel_spins_card | wheel_spins | card_id |
| idx_wheel_spins_business | wheel_spins | business_id |

## Strategie de migration

Les migrations sont appliquees via le CLI Supabase ou directement dans le dashboard Supabase. Elles sont stockees dans `supabase/migrations/` et executees dans l'ordre chronologique.

**Convention de nommage** : `YYYYMMDD_description.sql` ou `description.sql` (migrations initiales).
