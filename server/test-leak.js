import { VOCABULARY_DATA } from './tricksData.js';

console.log("--- Vocabulary Leak Test ---");

const lcmVocab = VOCABULARY_DATA.filter(v => v.topic_name === 'LCM & HCF');
console.log(`LCM & HCF Vocabulary Count: ${lcmVocab.length}`);
const hasCyclicity = lcmVocab.some(v => v.term === 'Cyclicity');
const hasDivisor = lcmVocab.some(v => v.term === 'Divisor');

if (hasCyclicity || hasDivisor) {
  console.log("❌ FAILED: LCM & HCF contains 'Cyclicity' or 'Divisor'. Content is leaking.");
} else {
  console.log("✅ PASSED: LCM & HCF does not contain leaked vocabulary.");
}

const nsVocab = VOCABULARY_DATA.filter(v => v.topic_name === 'Number System');
console.log(`Number System Vocabulary Count: ${nsVocab.length}`);
const nsHasCyclicity = nsVocab.some(v => v.term === 'Cyclicity');
const nsHasDivisor = nsVocab.some(v => v.term === 'Divisor');

if (nsHasCyclicity && nsHasDivisor) {
  console.log("✅ PASSED: Number System correctly contains 'Cyclicity' and 'Divisors'.");
} else {
  console.log("❌ FAILED: Number System is missing expected vocabulary.");
}
