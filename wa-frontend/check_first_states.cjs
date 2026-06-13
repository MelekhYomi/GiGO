const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');

// Find all occurrences of calibrationDilemmaIndex
let pos = -1;
let index = 1;
while ((pos = content.indexOf('calibrationDilemmaIndex', pos + 1)) !== -1) {
  console.log(`\nOccurrence ${index} of calibrationDilemmaIndex at index ${pos}:`);
  const lines = content.substring(pos, pos + 1000).split('\n');
  lines.slice(0, 15).forEach((line, idx) => {
    console.log(`  ${idx + 1}: ${line}`);
  });
  index++;
}

console.log("\nChecking for any definition of topUpAmount:");
let topUpPos = content.indexOf('topUpAmount');
if (topUpPos !== -1) {
  console.log(`Found topUpAmount around index ${topUpPos}:`);
  const lines = content.substring(topUpPos - 200, topUpPos + 200).split('\n');
  lines.forEach((line) => console.log('  ' + line));
} else {
  console.log("topUpAmount is NOT defined anywhere in App.tsx!");
}
