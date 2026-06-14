# CLAUDE.md — Projet « Mondial 2026 »

> Fichier de contexte pour Claude Code. À lire en début de session.
> Dernière mise à jour : 13 juin 2026.

## En une phrase
App web de suivi de la Coupe du monde 2026 (poules, matchs, scores live, probabilités V-N-D, classements, tableau final) qui se met à jour **toute seule**, hébergée **gratuitement** sur GitHub Pages, alimentée par un robot GitHub Actions.

## Coordonnées
- **Dépôt** : https://github.com/chbill5/mondial-2026 — public, branche par défaut = `main`
- **Site** : https://chbill5.github.io/mondial-2026/
- **Dossier local** : `C:\Users\chebi\Documents\AI\Création application Coupe du monde 2026` (Windows / PowerShell)
- **Outils** : Node v24, npm 11.9, git 2.53 — construit avec Claude Code (Sonnet 4.6, Claude Pro)

## Architecture (« Option B »)
APIs gratuites → **robot GitHub Actions** (~toutes les 15 min) → écrit `data/*.json` dans le dépôt → **GitHub Pages** sert le site → `index.html` **lit les JSON** et calcule le reste (classements, tableau, probas).
**Aucune clé dans le code** : tout est dans les **GitHub Secrets**.

## Fichiers clés
- `index.html` — toute l'app (UI + logique de calcul). Lit `data/*.json`, mappe les équipes par code/TLA, injecte les scores en **lecture seule**, recalcule classements + tableau. Conserve : design, probas V-N-D, forme 5 derniers, surlignage France.
- `scripts/fetch-data.js` — Node (fetch natif + `--env-file`). Écrit `data/fixtures.json` + `data/standings.json`.
- `.github/workflows/update-data.yml` — robot de mise à jour.
- `.env` (local, **gitignoré**) + GitHub Secret `FOOTBALL_DATA_TOKEN`.
- `.gitignore`, `CLAUDE.md`.

## Source de données
- **football-data.org** — fixtures, résultats, classements de la CDM.
  - Base : `https://api.football-data.org/v4` · header `X-Auth-Token` · compétition `WC`
  - Endpoints : `/competitions/WC/matches`, `/competitions/WC/standings`
  - Token : GitHub Secret **`FOOTBALL_DATA_TOKEN`** (+ `.env` local, jamais commité)
  - Limites : 10 req/min, scores légèrement différés, **pas** de joueurs ni de cotes sur le plan gratuit
- **API-Football : ABANDONNÉ** — son plan gratuit bloque la saison 2026.
- *Prévues (pas encore branchées)* : **TheSportsDB** (joueurs + forme) ; **The Odds API** (cotes Winamax/Betclic FR).

## FAIT ✅
- Structure projet + git + `CLAUDE.md` + `.gitignore`.
- `scripts/fetch-data.js` (football-data.org : `/competitions/WC/matches` + `/standings`) → `data/fixtures.json` + `data/standings.json`.
- Workflow `update-data.yml` : cron `*/15` + `workflow_dispatch`, `actions/checkout@v6` + `actions/setup-node@v6`, commit des JSON **seulement si changés**, `permissions: contents: write`. **Testé, tourne tout seul.**
- GitHub Pages **en ligne** (Deploy from a branch → `main` → `/root`).
- `index.html` **branché sur les données live** : lit les JSON, scores live en lecture seule, classements + tableau recalculés ; design / probas V-N-D / forme / surlignage France conservés.
- Dernier commit code de référence : `49c9dee`.

## Roadmap restante (ordre proposé)
1. **Phase 3 — UX + diffusion** : ouvrir l'onglet Matchs **sur les matchs du jour** (remonter pour les précédents) + **chaînes** (beIN sur les 104 matchs ; M6 sur les matchs de la France + match d'ouverture + demi-finales + finale). *Aucune nouvelle source.*
2. **Phase 4 — Forme & fiches équipes** : V/N/D des **5 derniers** sur chaque affiche + **clic sur une équipe → joueurs + 10 derniers matchs**. *Via TheSportsDB (nouvelle source + extension du robot).*
3. **Phase 5 — Onglet « Parie »** : meilleures cotes **Winamax/Betclic**. *Via The Odds API (clé dans Secrets + extension du robot).*
4. **Phase 6 — Onglet « Adversaires possibles en finale »** : choisir une équipe → adversaires possibles en finale classés par probabilité, mis à jour. *Calcul sur le tableau + niveaux, pas de nouvelle source.*

## Pièges déjà rencontrés (ne pas refaire)
- **API-Football gratuit** ne donne pas la saison 2026 → utiliser football-data.org.
- GitHub **n'indexe les workflows que depuis la branche par défaut** → `main` doit rester la branche par défaut (on avait poussé `master` au départ) et Pages doit pointer sur `main`.
- **Permissions du workflow** : régler sur **« Read and write »** (Paramètres → Actions → Général).
- Actions **Node 20 dépréciées le 16/06/2026** → tout en `@v6`.
- **`.env` est gitignoré** : ne jamais le commiter ni coller le token dans un chat.
- **UI GitHub en français** : `main` = « principal », `master` = « maître », Actions = « Actes », Branches = « Succursales ».

## Décisions encore ouvertes
- Ajouter ou non un **mode « pronostics »** (saisir ses propres scores à côté de la réalité) — mis de côté pour l'instant.

## Comment reprendre
- **Construire/committer** → Claude Code dans le dossier projet (il a `CLAUDE.md` + le code + accès git).
- **Stratégie/guidage** → nouvelle conversation dans le même Projet Claude + coller le hand-off (plus léger en tokens).
