const fs = require('fs');

const appFile = 'c:/Users/iYomi/Desktop/wa-ecosystem/wa-frontend/src/App.tsx';
const content = fs.readFileSync(appFile, 'utf8');
const lines = content.split('\n');

console.log('--- SCANNING APP.TSX FOR wa_token OR login ---');

lines.forEach((line, idx) => {
  if (line.includes('wa_token') || line.includes('localStorage.setItem(')) {
    console.log(`Line ${idx + 1}: ${line.replace(/\r/g, '')}`);
  }
});
