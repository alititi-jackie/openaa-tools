import test from 'node:test';
import assert from 'node:assert/strict';

function score(docs) {
  const byType = new Map();
  for (const doc of docs) {
    const key = doc.proofType || doc.id;
    const existing = byType.get(key);
    if (!existing || doc.points > existing.points) byType.set(key, doc);
  }
  return [...byType.values()].reduce((sum, doc) => sum + doc.points, 0);
}

test('same proof type uses only the highest point value', () => {
  assert.equal(score([
    { id: 'medicaid-photo', proofType: 'medicaid', points: 3 },
    { id: 'medicaid-no-photo', proofType: 'medicaid', points: 2 }
  ]), 3);
});

test('different DMV proof types can be added', () => {
  assert.equal(score([
    { id: 'foreign-passport', proofType: 'foreign-passport', points: 4 },
    { id: 'ead', proofType: 'ead', points: 3 }
  ]), 7);
});

test('common green card combination totals six', () => {
  assert.equal(score([
    { id: 'green-card', proofType: 'green-card', points: 3 },
    { id: 'ssn', proofType: 'ssn', points: 2 },
    { id: 'bank', proofType: 'bank-record', points: 1 }
  ]), 6);
});
