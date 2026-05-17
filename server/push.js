const { execSync } = require('child_process');
const dir = __dirname.replace(/\\server$/, '');
function run(cmd) { console.log('>', cmd); console.log(execSync(cmd, { cwd: dir, encoding: 'utf8' }).trim()); }
try {
  run('git add -A');
  run('git commit -m "chore: cleanup"');
  run('git push origin full_test1');
  run('git push moi full_test1');
  console.log('Done');
} catch(e) { console.error(e.stderr || e.message); }
