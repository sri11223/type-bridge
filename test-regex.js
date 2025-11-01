const fs = require('fs');
const path = require('path');

const schemaPath = 'd:/real-world-test/prisma/schema.prisma';
const content = fs.readFileSync(schemaPath, 'utf-8');

console.log('=== TESTING REGEX ===\n');

// Current regex (BROKEN)
const modelRegex = /model\s+\w+\s*\{[^}]+\}/g;
const matches = content.match(modelRegex);

console.log('Found models with current regex:', matches ? matches.length : 0);
if (matches) {
  matches.forEach((m, i) => {
    const firstLine = m.split('\n')[0];
    console.log(`  ${i+1}: ${firstLine}`);
  });
}

console.log('\n=== BETTER REGEX ===\n');

// Better regex that handles nested braces
const betterRegex = /model\s+(\w+)\s*\{[\s\S]*?\n\}/g;
const betterMatches = content.match(betterRegex);

console.log('Found models with better regex:', betterMatches ? betterMatches.length : 0);
if (betterMatches) {
  betterMatches.forEach((m, i) => {
    const firstLine = m.split('\n')[0];
    console.log(`  ${i+1}: ${firstLine}`);
  });
}

console.log('\n=== ENUM CHECK ===\n');

// Check for enums
const enumRegex = /enum\s+(\w+)\s*\{[\s\S]*?\n\}/g;
const enumMatches = content.match(enumRegex);

console.log('Found enums:', enumMatches ? enumMatches.length : 0);
if (enumMatches) {
  enumMatches.forEach((m, i) => {
    const firstLine = m.split('\n')[0];
    console.log(`  ${i+1}: ${firstLine}`);
  });
}
