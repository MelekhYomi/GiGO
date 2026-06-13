const fs = require('fs');
const path = require('path');

const scratchDir = 'C:/Users/iYomi/.gemini/antigravity/brain/73a25aa5-6199-4c96-89c6-ba8f05fc005c/scratch';
const files = fs.readdirSync(scratchDir);

console.log("Scanning scratch files for 'topUpAmount'...");
files.forEach(file => {
  if (file.startsWith('rebuild_app_v') && file.endsWith('.js')) {
    const fullPath = path.join(scratchDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('topUpAmount')) {
      console.log(`- Found 'topUpAmount' in file: ${file}`);
      // Find where states are declared in this file
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('topUpAmount') && line.includes('useState')) {
          console.log(`  Line ${idx+1}: ${line.trim()}`);
        }
      });
    }
  }
});
