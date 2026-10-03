const assert = require('assert');

function score(docs) {
  const byType = new Map();
  docs.forEach((doc) => {
    const key = doc.proofType || doc.id;
    const existing = byType.get(key);
    if (!existing || doc.points > existing.points) byType.set(key, doc);
  });
  return [...byType.values()].reduce((sum, doc) => sum + doc.points, 0);
}

assert.strictEqual(score([
  { id: 'medicaid-photo', proofType: 'medicaid', points: 3 },
  { id: 'medicaid-no-photo', proofType: 'medicaid', points: 2 }
]), 3, 'Medicaid alternatives must not double count');

assert.strictEqual(score([
  { id: 'foreign-passport', proofType: 'foreign-passport', points: 4 },
  { id: 'ead', proofType: 'ead', points: 3 }
]), 7, 'Different DMV proof types may be added');

assert.strictEqual(score([
  { id: 'green-card', proofType: 'green-card', points: 3 },
  { id: 'ssn', proofType: 'ssn', points: 2 },
  { id: 'bank', proofType: 'bank-record', points: 1 }
]), 6, 'Common valid combination should total 6');

console.log('DMV 6 Points dedup tests passed');
