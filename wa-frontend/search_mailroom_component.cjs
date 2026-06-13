const fs = require('fs');

const appFile = 'c:/Users/iYomi/Desktop/wa-ecosystem/wa-frontend/src/App.tsx';
const content = fs.readFileSync(appFile, 'utf8');
const lines = content.split('\n');

console.log('--- SCANNING APP.TSX FOR MAILROOM UI LAYOUT ---');

let foundIndex = -1;
lines.forEach((line, idx) => {
  if (line.includes('activeWorkspaceTab === \'mailroom\'') || line.includes('className="mailroom-container"')) {
    foundIndex = idx;
  }
});

if (foundIndex !== -1) {
  console.log(`Found mailroom UI start around line ${foundIndex + 1}`);
  const start = Math.max(0, foundIndex - 5);
  const end = Math.min(lines.length - 1, foundIndex + 150);
  for (let i = start; i <= end; i++) {
    console.log(`${i + 1}: ${lines[i].replace(/\r/g, '')}`);
  }
} else {
  console.log('Mailroom container UI not found.');
}
