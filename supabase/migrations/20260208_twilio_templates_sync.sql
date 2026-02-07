-- =============================================================================
-- Migration: Sync WhatsApp templates with real Twilio Content SIDs
-- Date: 2026-02-08
-- Description: Replace placeholder templates with actual Twilio-approved templates
-- =============================================================================

-- 1. Delete old placeholder templates
DELETE FROM public.whatsapp_templates
WHERE name IN (
  'welcome_bobotcho',
  'promo_whatsapp',
  'order_confirmation',
  'reactivation_client',
  'referral_invite',
  'cart_reminder'
);

-- 2. Insert real Twilio-approved templates with Content SIDs
INSERT INTO public.whatsapp_templates (name, display_name, category, status, language, body, variables, twilio_content_sid)
VALUES
  ('bobotcho_avis_post_achat',
   'Avis Post-Achat',
   'UTILITY', 'approved', 'fr',
   'Bonjour {{1}}, merci pour votre message. Nos conseillers Bobotcho sont actuellement indisponibles, mais nous traiterons votre demande en priorité dès demain matin à 8h. Consultez notre guide {{2}} en attendant. Merci de votre patience !',
   '["Nom du client", "Lien guide"]',
   'HXb1697c0b2c263e57ef481a851f9a696a'),

  ('bobotcho_livraison_imminente',
   'Livraison Imminente',
   'UTILITY', 'approved', 'fr',
   'Bonjour {{1}}, votre colis Bobotcho arrive aujourd''hui ou demain. Notre livreur vous contactera dans les prochaines heures. Préparez-vous à découvrir ce que signifie vraiment être propre !',
   '["Nom du client"]',
   'HX2a5eadca5715b45a3a21f8c9427f06af'),

  ('bobotcho_avis_post_achat_v2',
   'Avis Post-Achat V2',
   'MARKETING', 'approved', 'fr',
   'Bonjour {{1}}, voilà maintenant quelques jours que vous utilisez votre Bobotcho. Votre avis est précieux pour nous ! Comment décririez-vous votre nouvelle sensation de fraîcheur ? Partagez votre expérience {{2}}. Merci d''avance !',
   '["Nom du client", "Lien avis"]',
   'HXd0b28d4eba9b9d2b97d84708214fdc45'),

  ('bobotcho_rguide_installation',
   'Guide Installation',
   'UTILITY', 'approved', 'fr',
   'Bonjour {{1}}, vous allez adorer la simplicité de Bobotcho. Installation en 10 minutes, sans outils. Voici votre guide vidéo {{2}} pour commencer à profiter d''une fraîcheur absolue. Bonne installation !',
   '["Nom du client", "Lien vidéo"]',
   'HX79255b66bb1cf3c516d91a1cc1f2595c'),

  ('bobotcho_panier_abandonne_v2',
   'Panier Abandonné V2',
   'MARKETING', 'approved', 'fr',
   'Bonjour {{1}}, votre confort ne devrait pas attendre. Vous avez laissé votre Bobotcho dans le panier, mais chaque jour sans lui est un jour de plus avec irritations et inconfort. Finalisez votre commande {{2}}. Votre bien-être vous attend !',
   '["Nom du client", "Lien panier"]',
   'HXeb404635e8d4ca6d920dbaa2db7d231b'),

  ('bobotcho_paiement_reussi',
   'Paiement Réussi',
   'UTILITY', 'approved', 'fr',
   'Cher Monsieur, Chère Madame {{1}}, votre paiement pour la commande {{2}} est bien reçu. Votre voyage vers un nouveau standard d''hygiène et de dignité commence maintenant. Merci de votre confiance en Bobotcho.',
   '["Nom du client", "Numéro commande"]',
   'HX4db9d71658a47c6ea17bd86e5055358d'),

  ('bobotcho_bienvenue_optin',
   'Bienvenue Opt-in',
   'UTILITY', 'approved', 'fr',
   'Bienvenue chez Bobotcho {{1}} ! Vous recevrez ici vos confirmations de commande et le suivi de votre livraison. Nous respectons votre tranquillité : pour ne plus recevoir de messages, répondez STOP.',
   '["Nom du client"]',
   'HX270c5f49a05db6b144e08d91cbd7a082')

ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  twilio_content_sid = EXCLUDED.twilio_content_sid,
  updated_at = now();
