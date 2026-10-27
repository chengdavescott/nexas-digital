-- PostgreSQL schema for Nexas Digital shared store
-- This matches the Vercel API in api/store.ts

CREATE TABLE IF NOT EXISTS public.nexas_store (
  store_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nexas_store_updated_at
  ON public.nexas_store (updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_nexas_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nexas_store_updated_at ON public.nexas_store;

CREATE TRIGGER trg_nexas_store_updated_at
BEFORE UPDATE ON public.nexas_store
FOR EACH ROW
EXECUTE FUNCTION public.set_nexas_store_updated_at();

COMMENT ON TABLE public.nexas_store IS 'Shared app data for localStorage-backed store syncing across browsers';
COMMENT ON COLUMN public.nexas_store.store_key IS 'Logical key name for a synced store segment such as users, transactions, deposits, or crypto config';
COMMENT ON COLUMN public.nexas_store.data IS 'JSON document payload for the store key';
COMMENT ON COLUMN public.nexas_store.updated_at IS 'Timestamp for the last sync update';
