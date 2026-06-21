const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..', 'frontend');

// Find all HTML files in frontend root
const htmlFiles = fs.readdirSync(root)
  .filter(f => f.endsWith('.html'))
  .map(f => path.join(root, f));

// Get all assets recursively
function getFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

const assets = [
  ...getFiles(path.join(root, 'js')),
  ...getFiles(path.join(root, 'styles')),
  ...getFiles(path.join(root, 'images')),
  ...getFiles(path.join(root, 'assets-v2')),
].filter(f => {
  const ext = path.extname(f);
  return ['.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.woff', '.woff2', '.ttf'].includes(ext);
});

// Calculate hash for each file and replace in html files
assets.forEach(filePath => {
  const relativePath = path.relative(root, filePath);
  if (relativePath === 'js/counters.js') return; // protected

  const content = fs.readFileSync(filePath);
  const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 10);

  // Escaping for regex (forward slash needs to support regex escaping)
  const esc = relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  htmlFiles.forEach(htmlPath => {
    let html = fs.readFileSync(htmlPath, 'utf8');
    // regex pattern: (src|href)="path(?v=...)?"
    const regex = new RegExp(`((src|href)="${esc})(\\?v=[^"]*)?"`, 'g');
    if (regex.test(html)) {
      html = html.replace(regex, `$1?v=${hash}"`);
      fs.writeFileSync(htmlPath, html, 'utf8');
    }
  });
});

console.log('Cache-busting successfully executed on host.');
