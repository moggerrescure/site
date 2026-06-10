'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');

// Helper to make GET requests returning JSON
function getJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'MemorialSiteImageSeeder/1.0 (contact: admin@admin.local; bot)'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status: ${res.statusCode}`));
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

// Helper to download a file
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = client.get(url, {
      headers: {
        'User-Agent': 'MemorialSiteImageSeeder/1.0 (contact: admin@admin.local; bot)'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status: ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    req.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: node download-wikimedia-image.js <search_keyword> <target_webp_name> <generation_number>');
    process.exit(1);
  }

  const [keyword, targetName, genStr] = args;
  const gen = parseInt(genStr, 10);
  const tempPng = path.join(__dirname, `../temp_${targetName}.png`);

  console.log(`\nSearching Wikimedia Commons for "${keyword}"...`);
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keyword)}&srnamespace=6&format=json&utf8=1`;
  
  try {
    const searchRes = await getJson(searchUrl);
    const results = searchRes.query?.search;
    if (!results || results.length === 0) {
      throw new Error(`No search results found for "${keyword}"`);
    }

    // Try to find a JPG or PNG file in the top results
    let selectedFile = null;
    for (const item of results) {
      const title = item.title;
      if (title.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
        selectedFile = title;
        break;
      }
    }

    if (!selectedFile) {
      selectedFile = results[0].title;
    }

    console.log(`Selected file: ${selectedFile}`);

    // Query image info for direct URL
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(selectedFile)}&prop=imageinfo&iiprop=url&format=json`;
    const infoRes = await getJson(infoUrl);
    
    const pages = infoRes.query?.pages;
    if (!pages) {
      throw new Error('Could not retrieve image info');
    }

    const pageId = Object.keys(pages)[0];
    const imageinfo = pages[pageId].imageinfo;
    if (!imageinfo || imageinfo.length === 0) {
      throw new Error('Image info array is empty');
    }

    const directUrl = imageinfo[0].url;
    console.log(`Direct URL: ${directUrl}`);

    // Download to temporary PNG/JPG path
    console.log(`Downloading to ${tempPng}...`);
    await downloadFile(directUrl, tempPng);
    console.log('Download completed.');

    // Run processing script
    const processScript = path.join(__dirname, 'process-single-themed-image.js');
    console.log(`Running process script: node ${processScript} ${tempPng} ${targetName} ${gen}...`);
    
    // We import and run the process-single-themed-image.js directly as a module function or fork
    const execSync = require('child_process').execSync;
    execSync(`node "${processScript}" "${tempPng}" "${targetName}" ${gen}`, { stdio: 'inherit' });

    // Clean up temporary file
    if (fs.existsSync(tempPng)) {
      fs.unlinkSync(tempPng);
      console.log(`Cleaned up temporary file: ${tempPng}`);
    }

    console.log(`Successfully completed all steps for ${targetName}`);
  } catch (err) {
    console.error(`Error processing ${targetName}:`, err.message);
    if (fs.existsSync(tempPng)) {
      fs.unlinkSync(tempPng);
    }
    process.exit(1);
  }
}

run();
