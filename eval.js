// eval.js starter. Fill in the four TODOs, then run: node eval.js
// You should not need any libraries. Plain Node.js is enough.
const fs = require('fs');

// --- 1. Load the inputs (already done for you) -----------------------------
// test-set.csv has a header row, then: query,correct_post_ids
// correct_post_ids may be a semicolon list, e.g. "1024;1025".
function loadTestSet(path) {
  const lines = fs.readFileSync(path, 'utf8').trim().split('\n').slice(1);
  return lines.map(line => {
    const [query, ids] = line.split(',');
    return { query, correctIds: ids.split(';').map(Number) };
  });
}
const testSet = loadTestSet('test-set.csv');

// search-results.json maps each query to the top-10 ranked post_id lists that
// each system returned: { "<query>": { keyword: [...], semantic: [...] } }
const results = JSON.parse(fs.readFileSync('search-results.json', 'utf8'));

// --- 2. TODO: Reciprocal Rank ----------------------------------------------
// Return 1 / (rank of the FIRST correct id in rankedIds). Return 0 if none of
// the correct ids appear in rankedIds. Rank is 1-based (first result = rank 1).
function reciprocalRank(rankedIds, correctIds) {
  const rank = rankOf(rankedIds, correctIds);
  return rank ? 1 / rank : 0;
}

// Helper: the 1-based rank of the first correct id, or null if it is a miss.
function rankOf(rankedIds, correctIds) {
  const correctSet = new Set(correctIds);
  for (let i = 0; i < rankedIds.length; i++) {
    if (correctSet.has(rankedIds[i])) {
      return i + 1;
    }
  }
  return null;
}

// --- 3. TODO: run the evaluation loop --------------------------------------
// For every query: look up its keyword and semantic ranked lists, compute the
// reciprocal rank of each, accumulate the RRs, and count a "hit" whenever the
// correct answer was found in the top 10 (RR > 0).
// Then compute:
//   keywordMRR, semanticMRR         = average RR across all queries
//   keywordRecall, semanticRecall   = hits / number of queries
let keywordRRSum = 0;
let semanticRRSum = 0;
let keywordHits = 0;
let semanticHits = 0;

const tableRows = [];

for (const { query, correctIds } of testSet) {
  const queryResult = results[query] || { keyword: [], semantic: [] };
  const kwRank = rankOf(queryResult.keyword, correctIds);
  const semRank = rankOf(queryResult.semantic, correctIds);

  const kwRR = reciprocalRank(queryResult.keyword, correctIds);
  const semRR = reciprocalRank(queryResult.semantic, correctIds);

  keywordRRSum += kwRR;
  semanticRRSum += semRR;

  if (kwRank !== null) keywordHits++;
  if (semRank !== null) semanticHits++;

  tableRows.push({
    query,
    keywordRank: kwRank !== null ? String(kwRank) : 'miss',
    semanticRank: semRank !== null ? String(semRank) : 'miss',
  });
}

const n = testSet.length;
const keywordMRR = (keywordRRSum / n).toFixed(2);
const semanticMRR = (semanticRRSum / n).toFixed(2);
const keywordRecall = (keywordHits / n).toFixed(2);
const semanticRecall = (semanticHits / n).toFixed(2);

// --- 4. TODO: print a markdown comparison table ----------------------------
// Print one row per query: | query | keyword rank | semantic rank |  (use "miss"
// when the answer was not in the top 10), then a final **Summary** row with
// MRR and Recall@10 for each system, each rounded to 2 decimals.
console.log('| Query | Keyword rank | Semantic rank |');
console.log('|---|---|---|');
for (const row of tableRows) {
  console.log(`| ${row.query} | ${row.keywordRank} | ${row.semanticRank} |`);
}
console.log(
  `| **Summary** | **MRR ${keywordMRR} · Recall@10 ${keywordRecall}** | **MRR ${semanticMRR} · Recall@10 ${semanticRecall}** |`
);
