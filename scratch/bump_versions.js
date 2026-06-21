const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, '..', 'frontend');
const files = fs.readdirSync(directory).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(directory, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace any script src="js/..." with or without version with js/... ?v=19
  // Regex to match src="js/filename.js" or src="js/filename.js?v=..."
  const regex = /src=["']js\/([a-zA-Z0-9_\-\.]+)(?:\?v=[a-zA-Z0-9_\-]+)?["']/g;
  const newContent = content.replace(regex, 'src="js/$1?v=19"');

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Bumped script versions in ${file}`);
  }
});
