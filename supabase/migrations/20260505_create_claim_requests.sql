-- =============================================================================
-- Migration : Create claim_requests table (Story 4.4 Phase B)
-- Date      : 2026-05-05
-- Reference : Flow code éphémère de réclamation client → merchant
-- =============================================================================
--
-- CONTEXT
--
-- Le client clique "Réclamer ma récompense" → INSERT pending avec un code
-- à 6 chars affiché à l'écran. Il présente le code au merchant qui le
-- scanne ou le tape dans son interface. L'API merchant /api/scan/validate-claim
-- vérifie le code, exécute le claim (reset stamps ou deduct points), update
-- status='validated'.
--
-- Codes expirent après 5 minutes pour éviter le squat.
-- RLS verrouillée — toutes les opérations passent par les API (service_role).
--
-- Migration appliquée en prod via MCP le 2026-05-05.
--
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_card_id uuid NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  tier_id uuid,
  reward_name text NOT NULL,
  points_cost integer,
  loyalty_type text NOT NULL CHECK (loyalty_type IN ('stamps', 'points')),
  code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'expired', 'cancelled')),
  validated_at timestamptz,
  validated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_claim_requests_pending_code
  ON public.claim_requests(code)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_claim_requests_card_status
  ON public.claim_requests(loyalty_card_id, status);

CREATE INDEX IF NOT EXISTS idx_claim_requests_business_status
  ON public.claim_requests(business_id, status);

ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.claim_requests IS
  'Story 4.4 — Code éphémère de réclamation. Client génère un code (6 chars), merchant le scanne pour valider la récompense. Expire après 5 min. RLS verrouillée, accès uniquement via API (service_role).';
