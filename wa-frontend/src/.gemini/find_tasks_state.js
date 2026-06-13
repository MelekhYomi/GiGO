const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\iYomi\\Desktop\\wa-ecosystem\\wa-frontend\\src\\App.tsx', 'utf8');
const lines = content.split('\n');

console.log("=== Searching for [tasks, or tasks state initialization ===");
lines.forEach((line, idx) => {
  if (line.includes('useState') && (line.includes('tasks,') || line.includes('tasks ') || line.includes('setTasks'))) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
