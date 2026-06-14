// Récupère cotes WC 2026 depuis The Odds API (winamax_fr + betclic_fr)
// Usage: node --env-file=.env scripts/fetch-odds.js

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA = join(ROOT, "data");

const KEY = process.env.ODDS_API_KEY;
if (!KEY || KEY.trim() === "") {
  console.error("❌  Clé manquante. Ajoute ODDS_API_KEY=<ta_clé> dans .env puis relance.");
  process.exit(1);
}

// ── Mapping noms anglais → français ──────────────────────────────────────────
const EN_TO_FR = {
  "Mexico":"Mexique","South Africa":"Afrique du Sud","South Korea":"Corée du Sud",
  "Czech Republic":"Tchéquie","Czechia":"Tchéquie",
  "Canada":"Canada","Bosnia and Herzegovina":"Bosnie-Herzégovine","Qatar":"Qatar",
  "Switzerland":"Suisse",
  "Brazil":"Brésil","Morocco":"Maroc","Haiti":"Haïti","Scotland":"Écosse",
  "United States":"États-Unis","USA":"États-Unis","Paraguay":"Paraguay",
  "Australia":"Australie","Turkey":"Turquie","Türkiye":"Turquie",
  "Germany":"Allemagne","Curacao":"Curaçao","Curaçao":"Curaçao",
  "Ivory Coast":"Côte d'Ivoire","Cote d'Ivoire":"Côte d'Ivoire","Côte d'Ivoire":"Côte d'Ivoire",
  "Ecuador":"Équateur",
  "Netherlands":"Pays-Bas","Japan":"Japon","Sweden":"Suède","Tunisia":"Tunisie",
  "Belgium":"Belgique","Egypt":"Égypte","Iran":"Iran","IR Iran":"Iran",
  "New Zealand":"Nouvelle-Zélande",
  "Spain":"Espagne","Cape Verde":"Cap-Vert","Cabo Verde":"Cap-Vert",
  "Saudi Arabia":"Arabie saoudite","Uruguay":"Uruguay",
  "France":"France","Senegal":"Sénégal","Iraq":"Irak","Norway":"Norvège",
  "Argentina":"Argentine","Algeria":"Algérie","Austria":"Autriche","Jordan":"Jordanie",
  "Portugal":"Portugal","DR Congo":"RD Congo","Congo DR":"RD Congo",
  "Uzbekistan":"Ouzbékistan","Colombia":"Colombie",
  "England":"Angleterre","Croatia":"Croatie","Ghana":"Ghana","Panama":"Panama"
};

// ── GM : mêmes données qu'index.html (id = "G" + index) ─────────────────────
const GM = [
  ["A","11/6","21h","Mexique","Afrique du Sud"],["A","12/6","4h","Corée du Sud","Tchéquie"],
  ["A","18/6","18h","Tchéquie","Afrique du Sud"],["A","19/6","3h","Mexique","Corée du Sud"],
  ["A","25/6","3h","Tchéquie","Mexique"],["A","25/6","3h","Afrique du Sud","Corée du Sud"],
  ["B","12/6","21h","Canada","Bosnie-Herzégovine"],["B","13/6","21h","Qatar","Suisse"],
  ["B","18/6","21h","Suisse","Bosnie-Herzégovine"],["B","19/6","0h","Canada","Qatar"],
  ["B","24/6","21h","Suisse","Canada"],["B","24/6","21h","Bosnie-Herzégovine","Qatar"],
  ["C","14/6","0h","Brésil","Maroc"],["C","14/6","3h","Haïti","Écosse"],
  ["C","20/6","0h","Écosse","Maroc"],["C","20/6","2h30","Brésil","Haïti"],
  ["C","25/6","0h","Écosse","Brésil"],["C","25/6","0h","Maroc","Haïti"],
  ["D","13/6","3h","États-Unis","Paraguay"],["D","14/6","6h","Australie","Turquie"],
  ["D","19/6","21h","États-Unis","Australie"],["D","20/6","5h","Turquie","Paraguay"],
  ["D","26/6","4h","Turquie","États-Unis"],["D","26/6","4h","Paraguay","Australie"],
  ["E","14/6","19h","Allemagne","Curaçao"],["E","15/6","1h","Côte d'Ivoire","Équateur"],
  ["E","20/6","22h","Allemagne","Côte d'Ivoire"],["E","21/6","2h","Équateur","Curaçao"],
  ["E","25/6","22h","Curaçao","Côte d'Ivoire"],["E","25/6","22h","Équateur","Allemagne"],
  ["F","14/6","22h","Pays-Bas","Japon"],["F","15/6","4h","Suède","Tunisie"],
  ["F","20/6","19h","Pays-Bas","Suède"],["F","21/6","6h","Tunisie","Japon"],
  ["F","26/6","1h","Japon","Suède"],["F","26/6","1h","Tunisie","Pays-Bas"],
  ["G","15/6","21h","Belgique","Égypte"],["G","16/6","3h","Iran","Nouvelle-Zélande"],
  ["G","21/6","21h","Belgique","Iran"],["G","22/6","3h","Nouvelle-Zélande","Égypte"],
  ["G","27/6","5h","Égypte","Iran"],["G","27/6","5h","Nouvelle-Zélande","Belgique"],
  ["H","15/6","18h","Espagne","Cap-Vert"],["H","16/6","0h","Arabie saoudite","Uruguay"],
  ["H","21/6","18h","Espagne","Arabie saoudite"],["H","22/6","0h","Uruguay","Cap-Vert"],
  ["H","27/6","2h","Cap-Vert","Arabie saoudite"],["H","27/6","2h","Uruguay","Espagne"],
  ["I","16/6","21h","France","Sénégal"],["I","17/6","0h","Irak","Norvège"],
  ["I","22/6","23h","France","Irak"],["I","23/6","2h","Norvège","Sénégal"],
  ["I","26/6","21h","Norvège","France"],["I","26/6","21h","Sénégal","Irak"],
  ["J","17/6","3h","Argentine","Algérie"],["J","17/6","6h","Autriche","Jordanie"],
  ["J","22/6","19h","Argentine","Autriche"],["J","23/6","5h","Jordanie","Algérie"],
  ["J","28/6","4h","Algérie","Autriche"],["J","28/6","4h","Jordanie","Argentine"],
  ["K","17/6","19h","Portugal","RD Congo"],["K","18/6","4h","Ouzbékistan","Colombie"],
  ["K","23/6","19h","Portugal","Ouzbékistan"],["K","24/6","4h","Colombie","RD Congo"],
  ["K","28/6","1h30","Colombie","Portugal"],["K","28/6","1h30","RD Congo","Ouzbékistan"],
  ["L","17/6","22h","Angleterre","Croatie"],["L","18/6","1h","Ghana","Panama"],
  ["L","23/6","22h","Angleterre","Ghana"],["L","24/6","1h","Panama","Croatie"],
  ["L","27/6","23h","Panama","Angleterre"],["L","27/6","23h","Croatie","Ghana"]
];
GM.forEach((m, i) => { m.id = "G" + i; });

// ── KO : même structure qu'index.html ────────────────────────────────────────
const KO = [
  {id:"M73",a:"R:A",b:"R:B"},{id:"M74",a:"W:E",b:"T:M74"},{id:"M75",a:"W:F",b:"R:C"},
  {id:"M76",a:"W:C",b:"R:F"},{id:"M77",a:"W:I",b:"T:M77"},{id:"M78",a:"R:E",b:"R:I"},
  {id:"M79",a:"W:A",b:"T:M79"},{id:"M80",a:"W:L",b:"T:M80"},{id:"M81",a:"W:D",b:"T:M81"},
  {id:"M82",a:"W:G",b:"T:M82"},{id:"M83",a:"R:K",b:"R:L"},{id:"M84",a:"W:H",b:"R:J"},
  {id:"M85",a:"W:B",b:"T:M85"},{id:"M86",a:"W:J",b:"R:H"},{id:"M87",a:"W:K",b:"T:M87"},
  {id:"M88",a:"R:D",b:"R:G"},
  {id:"M89",a:"V:M74",b:"V:M77"},{id:"M90",a:"V:M73",b:"V:M75"},
  {id:"M91",a:"V:M76",b:"V:M78"},{id:"M92",a:"V:M79",b:"V:M80"},
  {id:"M93",a:"V:M83",b:"V:M84"},{id:"M94",a:"V:M81",b:"V:M82"},
  {id:"M95",a:"V:M86",b:"V:M88"},{id:"M96",a:"V:M85",b:"V:M87"},
  {id:"M97",a:"V:M89",b:"V:M90"},{id:"M98",a:"V:M93",b:"V:M94"},
  {id:"M99",a:"V:M91",b:"V:M92"},{id:"M100",a:"V:M95",b:"V:M96"},
  {id:"M101",a:"V:M97",b:"V:M98"},{id:"M102",a:"V:M99",b:"V:M100"},
  {id:"M103",a:"P:M101",b:"P:M102"},{id:"M104",a:"V:M101",b:"V:M102"}
];

// ── Résolution W:/R: depuis standings.json (groupes terminés uniquement) ──────
const W = {}, Rn = {};
const standingsPath = join(DATA, "standings.json");
if (existsSync(standingsPath)) {
  try {
    const sd = JSON.parse(readFileSync(standingsPath, "utf8"));
    for (const grp of (sd.standings || [])) {
      const raw = (grp.group || grp.type || "");
      const letter = raw.replace(/^GROUP[_\s]*/i, "").trim().slice(0, 1).toUpperCase();
      if (!letter || !/^[A-L]$/.test(letter)) continue;
      const table = grp.table || [];
      if (table.length >= 1) W[letter]  = EN_TO_FR[table[0].team?.name] || table[0].team?.name;
      if (table.length >= 2) Rn[letter] = EN_TO_FR[table[1].team?.name] || table[1].team?.name;
    }
    const resolved = Object.keys(W);
    console.log(`   standings.json lu → groupes dispo : ${resolved.length > 0 ? resolved.join(" ") : "(aucun)"}`);
  } catch (e) {
    console.warn("⚠️  standings.json illisible :", e.message);
  }
} else {
  console.log("   standings.json absent — slots KO non résolus");
}

function resolveSlot(ref) {
  if (!ref) return null;
  const [k, v] = ref.split(":");
  if (k === "W") return W[v] || null;
  if (k === "R") return Rn[v] || null;
  return null; // T:, V:, P: nécessitent des résultats KO → résolution différée
}

// ── Dictionnaire paire→{id, home, away} ──────────────────────────────────────
const pairToId = new Map();

GM.forEach(m => {
  pairToId.set([m[3], m[4]].sort().join("|"), { id: m.id, home: m[3], away: m[4] });
});

let koResolved = 0;
KO.forEach(m => {
  const a = resolveSlot(m.a), b = resolveSlot(m.b);
  if (a && b) {
    pairToId.set([a, b].sort().join("|"), { id: m.id, home: a, away: b });
    koResolved++;
  }
});
if (koResolved > 0) console.log(`   KO résolus depuis standings : ${koResolved} matchs`);

// ── Appel API ─────────────────────────────────────────────────────────────────
const API_URL =
  `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/` +
  `?apiKey=${KEY}&bookmakers=winamax_fr,betclic_fr&markets=h2h&oddsFormat=decimal`;

console.log("\n→ GET https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/?apiKey=***&bookmakers=winamax_fr,betclic_fr&markets=h2h&oddsFormat=decimal");

const res = await fetch(API_URL);
const remaining = res.headers.get("x-requests-remaining");
const used      = res.headers.get("x-requests-used");
console.log(`   HTTP ${res.status} ${res.statusText}`);
console.log(`   Crédits restants : ${remaining ?? "?"} (utilisés : ${used ?? "?"})`);

if (!res.ok) {
  let body = "";
  try { body = JSON.stringify(await res.json(), null, 2); } catch { body = await res.text(); }
  console.error(`❌  Erreur HTTP ${res.status} :\n${body}`);
  console.log("⚠️  odds.json non modifié.");
  process.exit(0);
}

const events = await res.json();
console.log(`   Events reçus    : ${events.length}`);

if (!events.length) {
  console.log("⚠️  Aucun event — odds.json non modifié.");
  process.exit(0);
}

// ── Traitement ────────────────────────────────────────────────────────────────
const odds = {};
let matched = 0, unmatched = 0;

for (const ev of events) {
  const homeEN = ev.home_team;
  const awayEN = ev.away_team;

  if (!EN_TO_FR[homeEN]) console.warn(`NON MAPPÉ: "${homeEN}"`);
  if (!EN_TO_FR[awayEN]) console.warn(`NON MAPPÉ: "${awayEN}"`);
  const homeFR = EN_TO_FR[homeEN];
  const awayFR = EN_TO_FR[awayEN];
  if (!homeFR || !awayFR) { unmatched++; continue; }

  const match = pairToId.get([homeFR, awayFR].sort().join("|"));
  if (!match) {
    console.warn(`⚠️  Paire non trouvée dans GM/KO : ${homeFR} vs ${awayFR}`);
    unmatched++;
    continue;
  }

  const best = { h: null, n: null, a: null };

  for (const bm of (ev.bookmakers || [])) {
    const h2h = bm.markets?.find(mk => mk.key === "h2h");
    if (!h2h) continue;
    for (const outcome of (h2h.outcomes || [])) {
      let side;
      if (outcome.name === "Draw") {
        side = "n";
      } else {
        const nameFR = EN_TO_FR[outcome.name] || outcome.name;
        if (nameFR === match.home)      side = "h";
        else if (nameFR === match.away) side = "a";
        else { console.warn(`NON MAPPÉ outcome : "${outcome.name}"`); continue; }
      }
      if (!best[side] || outcome.price > best[side].price) {
        best[side] = { price: outcome.price, book: bm.key };
      }
    }
  }

  if (best.h || best.a) {
    odds[match.id] = {};
    if (best.h) odds[match.id].h = best.h;
    if (best.n) odds[match.id].n = best.n;
    if (best.a) odds[match.id].a = best.a;
    matched++;
  }
}

console.log(`\n✅  Matchs associés : ${matched} / ${events.length}  (non associés : ${unmatched})`);

if (!matched) {
  console.log("⚠️  Aucune cote associée — odds.json non modifié.");
  process.exit(0);
}

// ── Écriture odds.json ────────────────────────────────────────────────────────
mkdirSync(DATA, { recursive: true });
writeFileSync(
  join(DATA, "odds.json"),
  JSON.stringify({ updated: new Date().toISOString(), odds }, null, 2),
  "utf8"
);
console.log(`   data/odds.json → ${matched} entrée(s)`);

// ── Extrait ───────────────────────────────────────────────────────────────────
console.log("\n── Extrait odds.json ──");
for (const [id, o] of Object.entries(odds).slice(0, 5)) {
  const h = o.h ? `1=${o.h.price}(${o.h.book})` : "1=?";
  const n = o.n ? `X=${o.n.price}(${o.n.book})` : "X=?";
  const a = o.a ? `2=${o.a.price}(${o.a.book})` : "2=?";
  console.log(`   ${id.padEnd(5)} : ${h}  ${n}  ${a}`);
}
