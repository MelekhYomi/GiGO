const fs = require('fs');

const appFile = 'c:/Users/iYomi/Desktop/wa-ecosystem/wa-frontend/src/App.tsx';
const content = fs.readFileSync(appFile, 'utf8');
const lines = content.split('\n');

console.log('--- SCANNING APP.TSX FOR API / INTERACTION LOGIC ---');

lines.forEach((line, idx) => {
  if (line.includes('/api/send-application-email') || line.includes('handleSendApplyEmail') || line.includes('triggerAutoApplyRoutine')) {
    console.log(`\n=================== LINE ${idx + 1} ===================`);
    const start = Math.max(0, idx - 10);
    const end = Math.min(lines.length - 1, idx + 10);
    for (let i = start; i <= end; i++) {
      const prefix = i === idx ? '=> ' : '   ';
      console.log(`${prefix}${i + 1}: ${lines[i].replace(/\r/g, '')}`);
    }
  }
});
