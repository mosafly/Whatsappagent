# Knowledge Base Bobotcho - Données pour RAG

Ce fichier contient les données à importer dans la table `knowledge_base` de Supabase pour le système RAG.

## Structure des documents

Chaque document doit être importé avec les métadonnées suivantes :
- `title`: Titre du document
- `content`: Contenu du document
- `category`: Catégorie (produit, installation, tarification, livraison, support)
- `priority`: Priorité 1-10 (10 = haute priorité)
- `metadata`: JSON avec métadonnées additionnelles

---

## Documents

### 1. Produit Bobotcho

**Title**: Qu'est-ce que Bobotcho ?
**Category**: produit
**Priority**: 10
**Content**: 
Bobotcho est un système de lavage à l'eau intégré qui transforme vos WC classiques en toilettes japonaises. C'est une innovation ivoirienne qui révolutionne l'hygiène intime à Abidjan.

Le produit se pose sur la plupart des WC classiques sans nécessiter d'outils complexes. Il fonctionne SANS électricité, utilisant uniquement la pression naturelle de l'eau.

Bobotcho convient à toute la famille : femmes (hygiène intime), hommes, enfants et personnes âgées. Le papier toilette devient optionnel avec Bobotcho.

**Metadata**: {"type": "description", "audience": "general"}

---

### 2. Installation

**Title**: Installation de Bobotcho
**Category**: installation
**Priority**: 9
**Content**:
L'installation de Bobotcho est simple et rapide :

1. Vérifiez que votre WC est compatible (la plupart des WC classiques le sont)
2. Positionnez Bobotcho sur la cuvette
3. Connectez-le à votre arrivée d'eau existante
4. Aucune alimentation électrique nécessaire

Temps d'installation : 5 à 10 minutes
Outils requis : Aucun outil complexe nécessaire

Nos techniciens peuvent effectuer l'installation pour vous à Abidjan (Cocody, Angré, Marcory, etc.).

**Metadata**: {"type": "instructions", "difficulty": "facile", "duration": "5-10 min"}

---

### 3. Spécifications Techniques

**Title**: Spécifications techniques de Bobotcho
**Category**: produit
**Priority**: 8
**Content**:
Bobotcho est conçu pour s'adapter aux installations de plomberie standard en Côte d'Ivoire.

Caractéristiques techniques :
- Fonctionnement : SANS électricité (pression naturelle de l'eau)
- Compatibilité : WC classiques standard
- Matériaux : Résistants et durables
- Maintenance : Minimaliste, facile à nettoyer

Le système utilise la pression de l'eau de votre installation existante, aucun raccordement électrique n'est nécessaire.

**Metadata**: {"type": "technical", "power": "none", "compatibility": "standard"}

---

### 4. Tarification

**Title**: Tarification Bobotcho
**Category**: tarification
**Priority**: 10
**Content**:
Offre WhatsApp Exclusive :

- Bobotcho Seul : 60 000 FCFA (Prix promo WhatsApp, économisez 40 000 FCFA par rapport au prix standard de 100 000 FCFA)
- Bobotcho + Installation : 70 000 FCFA (Nos techniciens s'occupent de tout, économisez 50 000 FCFA par rapport au prix standard de 120 000 FCFA)

Paiement : Cash on Delivery (paiement à la livraison)

**Metadata**: {"type": "pricing", "currency": "FCFA", "payment": "COD"}

---

### 5. Livraison

**Title**: Livraison et zones desservies
**Category**: livraison
**Priority**: 9
**Content**:
Nous livrons Bobotcho dans toute la Côte d'Ivoire.

Zones prioritaires à Abidjan :
- Cocody
- Angré
- Marcory
- Plateau
- Yopougon
- Abobo
- Treichville

Villes secondaires : Contactez-nous pour vérifier la disponibilité

Délai de livraison : 1 à 3 jours selon la zone

**Metadata**: {"type": "delivery", "zones": ["Abidjan", "Cocody", "Angré", "Marcory"], "delay": "1-3 days"}

---

### 6. Support Technique

**Title**: Support technique Bobotcho
**Category**: support
**Priority**: 8
**Content**:
Notre équipe de support est disponible pour vous aider :

Questions fréquentes :
- Installation : Nos techniciens peuvent vous aider
- Utilisation : Guide d'utilisation fourni
- Maintenance : Nettoyage simple avec eau savonneuse

Pour toute question technique, contactez-nous via WhatsApp ou appelez notre service client.

**Metadata**: {"type": "support", "channels": ["WhatsApp", "Phone"]}

---

### 7. Garantie

**Title**: Garantie Bobotcho
**Category**: support
**Priority**: 7
**Content**:
Bobotcho est garanti contre tout défaut de fabrication.

Durée de garantie : 12 mois à partir de la date d'achat

La garantie couvre :
- Défauts de fabrication
- Problèmes de fonctionnement liés au produit

La garantie ne couvre pas :
- Usure normale
- Mauvaise utilisation
- Dommages causés par une installation incorrecte

**Metadata**: {"type": "warranty", "duration": "12 months"}

---

### 8. Avantages

**Title**: Avantages de Bobotcho
**Category**: produit
**Priority**: 9
**Content**:
Pourquoi choisir Bobotcho ?

1. Hygiène supérieure : Lavage à l'eau plus efficace que le papier
2. Confort : Sensation de propreté japonaise adaptée à l'Afrique
3. Économique : Économisez 40 000 à 50 000 FCFA avec nos offres WhatsApp
4. Facile à installer : 5-10 minutes, pas d'électricité
5. Écologique : Réduit l'utilisation de papier toilette
6. Adapté à l'Afrique : Conçu pour les installations ivoiriennes
7. Convient à toute la famille : Femmes, hommes, enfants, personnes âgées

**Metadata**: {"type": "benefits", "count": 7}

---

### 9. Comparaison

**Title**: Bobotcho vs Papier Toilette
**Category**: produit
**Priority**: 6
**Content**:
Comparaison : Bobotcho vs Papier Toilette

Bobotcho :
- Lavage à l'eau (propreté japonaise)
- Plus hygiénique
- Réduit l'irritation
- Écologique
- Économique sur le long terme

Papier Toilette :
- Essuyage seulement
- Moins hygiénique
- Peut irriter
- Consommation continue
- Coût récurrent

**Metadata**: {"type": "comparison", "competitor": "papier toilette"}

---

### 10. Sécurité

**Title**: Sécurité d'utilisation de Bobotcho
**Category**: support
**Priority**: 8
**Content**:
Bobotcho est conçu pour une utilisation sûre :

- Pas d'électricité : Aucun risque électrique
- Pression d'eau contrôlée : Utilise la pression standard de votre installation
- Matériaux résistants : Durables et sûrs
- Facile à nettoyer : Hygiène maintenue facilement

Recommandations :
- Vérifiez régulièrement les connexions
- Nettoyez régulièrement avec eau savonneuse
- En cas de problème technique, contactez notre support

**Metadata**: {"type": "safety", "risks": "none"}
