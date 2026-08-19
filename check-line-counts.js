const fs = require('fs');
const path = require('path');

function getFiles(dir, extensions, excludeDirs = []) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!excludeDirs.some(d => file.includes(d))) {
        results = results.concat(getFiles(filePath, extensions, excludeDirs));
      }
    } else {
      if (extensions.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  });
  return results;
}

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

console.log('================ BACKEND PYTHON FILES ================');
const pyFiles = getFiles('backend', ['.py'], ['__pycache__', 'migrations', 'venv', '.git']);
const pyStats = pyFiles.map(f => ({ file: f, lines: countLines(f) })).sort((a, b) => b.lines - a.lines);
pyStats.forEach(item => {
  const flag = item.lines > 350 ? ' [EXCEEDS 350!]' : ' [OK]';
  console.log(`${item.lines.toString().padStart(5)} lines | ${item.file}${flag}`);
});

console.log('\n================ FRONTEND TYPESCRIPT/TSX FILES ================');
const tsFiles = getFiles('frontend-next', ['.ts', '.tsx'], ['node_modules', '.next', '.git']);
const tsStats = tsFiles.map(f => ({ file: f, lines: countLines(f) })).sort((a, b) => b.lines - a.lines);
tsStats.forEach(item => {
  const flag = item.lines > 350 ? ' [EXCEEDS 350!]' : ' [OK]';
  console.log(`${item.lines.toString().padStart(5)} lines | ${item.file}${flag}`);
});
