# Guide de mise en service — Module Réseaux sociaux

Ce guide explique les étapes à faire **toi-même** (création de compte Meta,
déploiement) pour activer le module. Le code (SQL, fonction serveur, panel
admin) est déjà en place dans le projet :

- `supabase_social_media.sql` — tables + trigger de priorité
- `supabase/functions/social-publish/index.ts` — moteur de publication
- `admin-panel.html` — nouvel onglet "Réseaux sociaux"

> ⚠️ Cette première version n'a pas pu être testée avec de vrais comptes
> Facebook/Instagram (je n'ai pas accès à tes identifiants). Prévois une
> phase de test (section 6) avant de compter dessus en production.

## 1. Exécuter la migration SQL

Dans Supabase → SQL Editor, exécute `supabase_social_media.sql` (une seule
fois). Il crée les tables `social_settings` / `social_queue`, le bucket de
stockage `social-media`, et le trigger qui met tout nouveau produit en tête
de file.

## 2. Créer l'app Meta et lier tes comptes

1. Assure-toi que ton compte **Instagram est en mode Professionnel
   (Business ou Créateur)** et qu'il est lié à ta **page Facebook** (obligatoire :
   Instagram n'autorise la publication automatique que via un compte pro lié
   à une page).
2. Va sur [developers.facebook.com](https://developers.facebook.com) →
   Créer une app → type "Entreprise".
3. Ajoute les produits **"Facebook Login"** et **"Instagram Graph API"**.
4. Dans "Outils" → **Graph API Explorer** :
   - Sélectionne ton app, connecte-toi avec le compte admin de la page.
   - Demande les permissions : `pages_show_list`, `pages_read_engagement`,
     `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`.
   - Génère un token utilisateur, puis échange-le contre un **token de
     page longue durée** (~60 jours) via l'outil "Access Token Debugger"
     ou l'endpoint `/oauth/access_token` avec `fb_exchange_token`.
5. Récupère :
   - **ID de la page Facebook** (`/me/accounts` dans Graph API Explorer)
   - **ID du compte Instagram Business** (`/{page-id}?fields=instagram_business_account`)
6. Tant que tu restes administrateur de l'app en mode "Développement", tu
   peux publier sur tes propres comptes **sans passer par l'App Review**
   de Meta. L'App Review ne devient nécessaire que si d'autres personnes
   doivent utiliser l'app.

## 3. Déployer la fonction serveur (Supabase Edge Function)

Depuis le dossier `site web/` (qui contient maintenant `supabase/functions/social-publish/`) :

```bash
npm install -g supabase
supabase login
supabase link --project-ref uyyillkilzsywcrrfbov
supabase functions deploy social-publish
```

Les variables `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectées
automatiquement par Supabase dans les Edge Functions, pas besoin de les
configurer manuellement.

## 4. Planifier l'exécution automatique (pg_cron)

Dans Supabase SQL Editor :

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'social-publish-hourly',
  '0 * * * *',  -- toutes les heures
  $$
  select net.http_post(
    url := 'https://uyyillkilzsywcrrfbov.supabase.co/functions/v1/social-publish',
    headers := jsonb_build_object(
      'Authorization', 'Bearer TON_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

Remplace `TON_SERVICE_ROLE_KEY` par la clé `service_role` (Supabase →
Project Settings → API — à garder secrète, ne jamais la mettre dans le
code du site). La fonction tourne toutes les heures mais ne publie
réellement que si c'est le bon jour, la bonne heure, et qu'elle n'a pas
déjà publié aujourd'hui — donc pas de risque de doublons.

## 5. Configurer dans le panel admin

Onglet **Réseaux sociaux** :

- Colle l'ID de page, le token, l'ID Instagram → "Enregistrer la connexion"
- Coche les jours (lundi/mercredi/samedi par défaut) et l'heure → "Enregistrer"
- Active le module avec le bouton "Module actif"

## 6. Tester avant de laisser tourner seul

Déclenche la fonction manuellement pour voir le résultat sans attendre le
cron :

```bash
curl -X POST https://uyyillkilzsywcrrfbov.supabase.co/functions/v1/social-publish \
  -H "Authorization: Bearer TON_SERVICE_ROLE_KEY"
```

Regarde les logs avec `supabase functions logs social-publish`, vérifie
dans l'onglet Réseaux sociaux que l'historique se remplit, et vérifie le
rendu réel du visuel avec texte incrusté sur ta page Facebook. Le style
du texte (police, couleurs, position) est dans `template_style` (table
`social_settings`) et dans la fonction `composeImage()` — à ajuster selon
le rendu obtenu.

## Aperçu avant publication

Dans l'onglet Réseaux sociaux, chaque ligne de la file d'attente a un bouton
"œil" qui ouvre un aperçu (image avec texte incrusté + texte de la
publication) sans rien publier sur Facebook/Instagram. Ça fonctionne dès que
la fonction est déployée (étape 3), même **avant** d'avoir connecté un
compte Meta — utile pour valider le rendu du gabarit en premier.

## À savoir

- Le token de page expire tous les ~60 jours : il faudra le renouveler
  (un rappel automatique pourra être ajouté plus tard si besoin).
- Pas de génération d'image IA : la fonction réutilise la première photo
  du produit et incruste titre / prix / tranche d'âge dessus.
- Un nouveau produit actif est automatiquement inséré en tête de la file
  d'attente (priorité maximale) via le trigger SQL.
