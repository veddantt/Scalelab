const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const dirs = ['app', 'components', 'features'];
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    walkDir(fullPath, (filePath) => {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content
          .replace(/#3B82F6/gi, '#6366F1')
          .replace(/#2563EB/gi, '#818CF8')
          .replace(/bg-blue-500/g, 'bg-[#6366F1]')
          .replace(/text-blue-500/g, 'text-[#6366F1]')
          .replace(/border-blue-500/g, 'border-[#6366F1]');
        if (content !== newContent) {
          fs.writeFileSync(filePath, newContent);
          console.log('Updated', filePath);
        }
      }
    });
  }
});
