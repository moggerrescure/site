'use strict';

const fs = require('node:fs');
const path = require('node:path');

const dir = 'C:\\Users\\ivan-\\.gemini\\antigravity\\brain\\8c0cdbeb-391b-4815-8999-7bb19de17ea7';
const transPath = path.join(dir, '.system_generated', 'logs', 'transcript.jsonl');

if (!fs.existsSync(transPath)) {
  console.log('No transcript found at:', transPath);
  process.exit(1);
}

// 1. Get prompts in order of step_index
const lines = fs.readFileSync(transPath, 'utf8').split('\n');
const prompts = [];
for (const line of lines) {
  if (line.includes('generate_image')) {
    try {
      const data = JSON.parse(line);
      const toolCalls = data.tool_calls || [];
      for (const tc of toolCalls) {
        if (tc.name === 'generate_image') {
          prompts.push({
            step: data.step_index,
            name: tc.args.ImageName,
            prompt: tc.args.Prompt
          });
        }
      }
    } catch (_) {}
  }
}

// 2. Get files in folder sorted by mtime
const files = fs.readdirSync(dir)
  .filter(f => f.startsWith('media__') && (f.endsWith('.png') || f.endsWith('.jpg')))
  .map(f => {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    return { name: f, time: stat.mtimeMs };
  })
  .sort((a, b) => a.time - b.time);

console.log(`Found ${prompts.length} prompts and ${files.length} files.`);

// Map them
for (let i = 0; i < Math.min(prompts.length, files.length); i++) {
  const isFemale = prompts[i].prompt.toLowerCase().includes('woman') || prompts[i].prompt.toLowerCase().includes('female') || prompts[i].prompt.toLowerCase().includes('volkova') || prompts[i].prompt.toLowerCase().includes('sokolova') || prompts[i].prompt.toLowerCase().includes('morozova');
  console.log(`${files[i].name} => ${prompts[i].name} (${isFemale ? 'FEMALE' : 'MALE'})`);
}
