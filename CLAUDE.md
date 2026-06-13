# Mondial 2026 — Documentation projet

## Objectif

Application web en français pour suivre la Coupe du monde 2026 : résultats en direct,
classements de poules, tableau final, probabilités et statistiques des équipes.
Hébergée gratuitement sur **GitHub Pages**, sans serveur à gérer.

---

## Architecture (à respecter strictement)

```
GitHub Actions (toutes les ~15 min)
  └─> Appelle les API externes (API-Football, The Odds API)
  └─> Traite les données
  └─> Écrit des fichiers JSON dans data/

GitHub Pages (site statique)
  └─> index.html + assets
  └─> Lit UNIQUEMENT les fichiers JSON de data/
  └─> N'appelle JAMAIS les API directement
```

**Règles impératives :**
- Les clés API sont stockées dans les **GitHub Secrets**, jamais dans le code.
- Le site est 100 % statique et hors-ligne capable (localStorage pour les saisies manuelles).
- Les scripts d'ingestion sont dans `scripts/` et tournent via GitHub Actions (`.github/workflows/`).
- Les données fraîches arrivent dans `data/` — le front-end les lit avec `fetch()`.

---

## Sources de données (branchement ultérieur)

| Source | Données fournies | Clé secrète |
|---|---|---|
| **API-Football** | Scores, calendrier, classements, effectifs, forme des 10 derniers matchs | `API_FOOTBALL_KEY` |
| **The Odds API** | Cotes Winamax et Betclic pour chaque match | `ODDS_API_KEY` |

---

## App actuelle — base (index.html)

`index.html` est une Single Page App autonome (vanilla JS, zero dépendance) avec :

- **48 équipes** dans 12 groupes (A à L), données Elo + forme 5 matchs codées en dur.
- **72 matchs de poule** (tableau `GM`) avec groupes, dates, heures et affrontements.
- **32 matchs de phase finale** (tableau `KO`, M73→M104) avec résolution automatique des slots.
- **3 onglets** :
  - *Matchs* : liste chronologique avec filtres groupe/France/KO, saisie de scores, barres de probabilités V/N/D.
  - *Poules* : tableau de classement par groupe (J/G/N/P/Diff/Pts + forme), mise à jour en temps réel.
  - *Tableau* : bracket 16es → Finale, remplissage automatique selon les scores saisis.
- **Probabilités** calculées via Elo (formule standard 400 points) :
  - Phase de poules : V / Nul / D
  - Phase finale : V domicile / V extérieur (pas de nul)
- **Sauvegarde automatique** via `localStorage` (clé `cdm2026_v1`).
- **Chemin France** mis en évidence (highlight doré sur les matchs M77, M89, M97, M101, M104).
- **3es places** : algorithme de backtracking pour affecter les 8 meilleurs 3es aux 8 slots selon les règles FIFA.

---

## Fonctionnalités visées (roadmap)

### Phase 1 — Infrastructure données (prochaine étape)
- Créer le workflow GitHub Actions (`update-data.yml`) qui tourne toutes les 15 min.
- Scripts Node dans `scripts/` pour appeler API-Football et écrire les JSON dans `data/`.
- Fichiers JSON cibles :
  - `data/matches.json` — tous les matchs avec scores live
  - `data/standings.json` — classements de poules
  - `data/odds.json` — cotes Winamax / Betclic
  - `data/players.json` — effectifs et stats par équipe
  - `data/form.json` — 10 derniers matchs de chaque équipe

### Phase 2 — Mise à jour automatique du front-end
- `index.html` lit `data/matches.json` au lieu des saisies manuelles.
- Mise à jour automatique du tableau après les poules (plus de saisie manuelle).
- Scores et probabilités V/N/D recalculés en temps réel depuis les données live.

### Phase 3 — Fiche équipe (clic sur une équipe)
- Vue détaillée : effectif complet (joueurs, poste, club, âge).
- 10 derniers matchs de l'équipe avec scores et adversaires.
- Forme V/N/D calculée sur les 10 derniers matchs.

### Phase 4 — Enrichissement des affiches
- Sur chaque carte de match : forme des 5 derniers matchs des 2 équipes côte à côte.
- Dates et horaires précis + chaînes de diffusion (M6 / beIN Sports).

### Phase 5 — Onglet Paris
- Onglet dédié aux cotes Winamax et Betclic pour chaque match.
- Comparaison côte à côte des deux bookmakers.
- Mise à jour automatique via `data/odds.json`.

### Phase 6 — Onglet Adversaires possibles
- Pour la France (ou toute équipe sélectionnée) : liste de tous les adversaires possibles en finale.
- Classés par probabilité de croiser cet adversaire en finale.
- Mise à jour dynamique au fil de la compétition.

---

## Structure des dossiers

```
/
├── index.html              # App principale (SPA vanilla JS)
├── CLAUDE.md               # Cette documentation
├── .gitignore
├── .github/
│   └── workflows/
│       └── (update-data.yml à créer phase 1)
├── data/                   # Fichiers JSON écrits par GitHub Actions
│   └── (matches.json, standings.json, odds.json… à créer phase 1)
└── scripts/                # Scripts Node d'ingestion des API
    └── (fetch-matches.js, fetch-odds.js… à créer phase 1)
```

---

## Conventions de développement

- **Langue** : tout en français (UI, commentaires, noms de variables métier).
- **Zéro dépendance front-end** : vanilla JS uniquement, pas de framework.
- **Scripts back-end** : Node.js, avec `node-fetch` ou `axios` si nécessaire.
- **Pas de secrets dans le code** : toujours via `process.env.MA_CLE` + GitHub Secrets.
- **GitHub Pages** : branche `main`, dossier racine `/`. Tout fichier statique est servi.
