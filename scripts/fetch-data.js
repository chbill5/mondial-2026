// Récupère matchs + classements Coupe du monde 2026 depuis football-data.org
// Usage : node --env-file=.env scripts/fetch-data.js

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA = join(ROOT, "data");

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
if (!TOKEN || TOKEN.trim() === "") {
  console.error("❌  Token manquant. Ajoute FOOTBALL_DATA_TOKEN dans .env puis relance.");
  process.exit(1);
}

const BASE = "https://api.football-data.org/v4";
const COMP = "WC";

async function apiFetch(path) {
  const url = `${BASE}${path}`;
  console.log(`→ GET ${url}`);
  const res = await fetch(url, {
    headers: { "X-Auth-Token": TOKEN },
  });

  if (!res.ok) {
    let body = "";
    try { body = JSON.stringify(await res.json(), null, 2); } catch { body = await res.text(); }
    console.error(`❌  Erreur HTTP ${res.status} ${res.statusText}`);
    console.error(body);
    process.exit(1);
  }

  return res.json();
}

function writeData(filename, data) {
  mkdirSync(DATA, { recursive: true });
  writeFileSync(join(DATA, filename), JSON.stringify(data, null, 2), "utf8");
}

function now() {
  return new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
}

// ── Garde « heures de match » ─────────────────────────────────────────────
// On n'appelle l'API que si un match est imminent (<10 min), en cours, ou
// vient de finir. Sinon on sort sans consommer d'appel. Un lancement manuel
// (workflow_dispatch) ou FORCE_FETCH=1 force le rafraîchissement.
const FORCE = process.env.GITHUB_EVENT_NAME === "workflow_dispatch"
           || process.env.FORCE_FETCH === "1";

function matchWindowOpen() {
  const fx = join(DATA, "fixtures.json");
  if (!existsSync(fx)) return true;                 // 1er run : on amorce
  let matches = [];
  try { matches = JSON.parse(readFileSync(fx, "utf8")).matches ?? []; }
  catch { return true; }                            // fichier illisible : on rafraîchit
  if (matches.length === 0) return true;

  const LEAD = 10  * 60 * 1000;                      // 10 min avant le coup d'envoi
  const RUN  = 160 * 60 * 1000;                      // 90' + mi-temps + prolong./t.a.b. + marge
  const nowMs = Date.now();
  return matches.some(m => {
    if (!m.utcDate) return false;
    const ko = new Date(m.utcDate).getTime();
    return nowMs >= ko - LEAD && nowMs <= ko + RUN;
  });
}

if (!FORCE && !matchWindowOpen()) {
  console.log(`⏸  Aucun match en cours ni imminent (${now()}). Aucun appel API.`);
  process.exit(0);
}

// ── Appels API (séquentiels : plan gratuit = 10 req/min) ─────────────────────

const matchesRes  = await apiFetch(`/competitions/${COMP}/matches`);
const standingsRes = await apiFetch(`/competitions/${COMP}/standings`);

// ── Écriture ──────────────────────────────────────────────────────────────────

writeData("fixtures.json",  matchesRes);
writeData("standings.json", standingsRes);

// ── Résumé ────────────────────────────────────────────────────────────────────

const matches = matchesRes.matches ?? [];
const finished  = matches.filter(m => m.status === "FINISHED").length;
const scheduled = matches.filter(m => m.status === "SCHEDULED" || m.status === "TIMED").length;
const live      = matches.filter(m => m.status === "IN_PLAY" || m.status === "PAUSED").length;
const groups    = standingsRes.standings ?? [];

console.log("\n✅  Données écrites dans data/");
console.log(`   fixtures.json  → ${matches.length} match(s)  [terminés: ${finished} | à venir: ${scheduled} | en cours: ${live}]`);
console.log(`   standings.json → ${groups.length} groupe(s)`);
console.log(`   Mis à jour le  : ${now()}`);

// Aperçu : 1er match du tournoi
if (matches.length > 0) {
  const m = matches[0];
  const date = m.utcDate?.slice(0, 10) ?? "?";
  const sh = m.score?.fullTime?.home ?? "-";
  const sa = m.score?.fullTime?.away ?? "-";
  console.log(`\n── Premier match ──`);
  console.log(`   ${date}  ${m.homeTeam?.name} ${sh}–${sa} ${m.awayTeam?.name}  [${m.status}]`);
}

// Aperçu : groupe de la France
const groupeFrance = groups.find(g =>
  g.table?.some(row => row.team?.name?.toLowerCase().includes("france"))
);
if (groupeFrance) {
  console.log(`\n── Groupe de la France (${groupeFrance.group ?? groupeFrance.type}) ──`);
  groupeFrance.table.forEach(row => {
    console.log(`   ${row.position}. ${row.team.name.padEnd(25)} ${row.points} pts  (${row.playedGames} j)`);
  });
} else if (groups.length > 0) {
  // Fallback : 1er groupe disponible
  const g = groups[0];
  console.log(`\n── ${g.group ?? g.type} ──`);
  g.table?.forEach(row => {
    console.log(`   ${row.position}. ${row.team.name.padEnd(25)} ${row.points} pts`);
  });
}
