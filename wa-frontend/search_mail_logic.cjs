const fs = require('fs');

const appFile = 'c:/Users/iYomi/Desktop/wa-ecosystem/wa-frontend/src/App.tsx';
const content = fs.readFileSync(appFile, 'utf8');
const lines = content.split('\n');

console.log('--- SCANNING APP.TSX FOR fetchMailThreads ---');

lines.forEach((line, idx) => {
  if (line.includes('fetchMailThreads')) {
    console.log(`\n=================== LINE ${idx + 1} ===================`);
    const start = Math.max(0, idx - 15);
    const end = Math.min(lines.length - 1, idx + 15);
    for (let i = start; i <= end; i++) {
      const prefix = i === idx ? '=> ' : '   ';
      console.log(`${prefix}${i + 1}: ${lines[i].replace(/\r/g, '')}`);
    }
  }
});
