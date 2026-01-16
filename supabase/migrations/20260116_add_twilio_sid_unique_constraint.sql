-- Migration pour ajouter une contrainte unique sur twilio_sid (idempotence)
-- Évite les doublons de messages Twilio

-- Créer un index unique sur les messages non nuls
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_twilio_sid_not_null 
ON public.messages (twilio_sid) 
WHERE twilio_sid IS NOT NULL;

-- Nettoyer les éventuels doublons existants (optionnel)
-- DELETE FROM public.messages 
-- WHERE id NOT IN (
--   SELECT DISTINCT ON (twilio_sid) id 
--   FROM public.messages 
--   WHERE twilio_sid IS NOT NULL 
--   ORDER BY twilio_sid, created_at DESC
-- );
