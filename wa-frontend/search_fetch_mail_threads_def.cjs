const fs = require('fs');

const appFile = 'c:/Users/iYomi/Desktop/wa-ecosystem/wa-frontend/src/App.tsx';
const content = fs.readFileSync(appFile, 'utf8');
const lines = content.split('\n');

console.log('--- SCANNING APP.TSX FOR fetchMailThreads DEFINITION ---');

lines.forEach((line, idx) => {
  if (line.includes('const fetchMailThreads') || line.includes('function fetchMailThreads')) {
    console.log(`\n=================== LINE ${idx + 1} ===================`);
    const start = Math.max(0, idx - 5);
    const end = Math.min(lines.length - 1, idx + 45);
    for (let i = start; i <= end; i++) {
      const prefix = i === idx ? '=> ' : '   ';
      console.log(`${prefix}${i + 1}: ${lines[i].replace(/\r/g, '')}`);
    }
  }
});
