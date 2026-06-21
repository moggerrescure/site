const fs = require('fs');
const files = [
  'frontend/js/person-edit.js',
  'frontend/js/tree-edit.js',
  'frontend/js/tree.js'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replaceAll(
    "window.location.port === '3000' ? '' : 'http://localhost:3000'",
    "(window.location.port === '3000' || window.location.port === '5500') ? '' : 'http://localhost:3000'"
  );
  fs.writeFileSync(f, content, 'utf8');
  console.log('Successfully updated:', f);
});
