-- Ajouter un champ de consentement RGPD sur les cartes client
ALTER TABLE loyalty_cards
ADD COLUMN IF NOT EXISTS rgpd_consent_at TIMESTAMPTZ;

-- Ajouter un champ pour la date de demande de suppression
ALTER TABLE loyalty_cards
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
