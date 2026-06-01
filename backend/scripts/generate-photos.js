'use strict';

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// 43 People data structure to generate correct age/era styles
const PEOPLE_SPECS = [
  // Generation 0 (Born ~1905-1913, deceased)
  { key: 'fedor_g0', gender: 'MALE', gen: 0, name: 'Фёдор Морозов', label: 'Любань, 1935 г.' },
  { key: 'anna_g0', gender: 'FEMALE', gen: 0, name: 'Анна Морозова', label: 'Любань, 1938 г.' },
  { key: 'ivan_g0', gender: 'MALE', gen: 0, name: 'Иван Соколов', label: 'Гомель, 1932 г.' },
  { key: 'maria_g0', gender: 'FEMALE', gen: 0, name: 'Мария Соколова', label: 'Гомель, 1936 г.' },

  // Generation 1 (Born ~1928-1936, deceased)
  { key: 'petr_g1', gender: 'MALE', gen: 1, name: 'Пётр Морозов', label: 'Минск, 1958 г.' },
  { key: 'olga_g1', gender: 'FEMALE', gen: 1, name: 'Ольга Морозова', label: 'Минск, 1961 г.' },
  { key: 'nina_g1', gender: 'FEMALE', gen: 1, name: 'Нина Волковы', label: 'Витебск, 1956 г.' },
  { key: 'sergey_g1', gender: 'MALE', gen: 1, name: 'Сергей Волков', label: 'Витебск, 1954 г.' },
  { key: 'vladimir_g1', gender: 'MALE', gen: 1, name: 'Владимир Соколов', label: 'Гомель, 1960 г.' },
  { key: 'valentina_g1', gender: 'FEMALE', gen: 1, name: 'Валентина Соколова', label: 'Гомель, 1963 г.' },
  { key: 'tatiana_g1', gender: 'FEMALE', gen: 1, name: 'Татьяна Петровы', label: 'Минск, 1959 г.' },
  { key: 'nikolay_g1', gender: 'MALE', gen: 1, name: 'Николай Петров', label: 'Минск, 1957 г.' },

  // Generation 2 (Born ~1954-1962, mixed D/L)
  { key: 'ivan_g2', gender: 'MALE', gen: 2, name: 'Иван Морозов', label: 'Минск, 1982 г.', deceased: true },
  { key: 'tamara_g2', gender: 'FEMALE', gen: 2, name: 'Тамара Морозова', label: 'Минск, 1985 г.', deceased: true },
  { key: 'svetlana_g2', gender: 'FEMALE', gen: 2, name: 'Светлана Морозова', label: 'Минск, 1980 г.', deceased: false },
  { key: 'andrey_g2', gender: 'MALE', gen: 2, name: 'Андрей Соколов', label: 'Минск, 1984 г.', deceased: false },
  { key: 'larisa_g2', gender: 'FEMALE', gen: 2, name: 'Лариса Соколова', label: 'Минск, 1986 г.', deceased: false },
  { key: 'viktor_g2', gender: 'MALE', gen: 2, name: 'Виктор Волков', label: 'Витебск, 1981 г.', deceased: true },
  { key: 'raisa_g2', gender: 'FEMALE', gen: 2, name: 'Раиса Волкова', label: 'Витебск, 1983 г.', deceased: false },
  { key: 'mikhail_g2', gender: 'MALE', gen: 2, name: 'Михаил Петров', label: 'Могилёв, 1988 г.', deceased: true },
  { key: 'zoya_g2', gender: 'FEMALE', gen: 2, name: 'Зоя Петрова', label: 'Могилёв, 1990 г.', deceased: false },

  // Generation 3 (Born ~1979-1986, all L)
  { key: 'sergey_g3', gender: 'MALE', gen: 3, name: 'Сергей Морозов', label: 'Минск, 2005 г.' },
  { key: 'alena_g3', gender: 'FEMALE', gen: 3, name: 'Алёна Морозова', label: 'Минск, 2007 г.' },
  { key: 'natalia_g3', gender: 'FEMALE', gen: 3, name: 'Наталья Морозова', label: 'Минск, 2008 г.' },
  { key: 'artem_g3', gender: 'MALE', gen: 3, name: 'Артём Соколов', label: 'Минск, 2006 г.' },
  { key: 'yulia_g3', gender: 'FEMALE', gen: 3, name: 'Юлия Соколова', label: 'Минск, 2009 г.' },
  { key: 'daria_g3', gender: 'FEMALE', gen: 3, name: 'Дарья Соколова', label: 'Минск, 2010 г.' },
  { key: 'dmitry_g3', gender: 'MALE', gen: 3, name: 'Дмитрий Волков', label: 'Витебск, 2004 г.' },
  { key: 'marina_g3', gender: 'FEMALE', gen: 3, name: 'Марина Волкова', label: 'Витебск, 2006 г.' },
  { key: 'roman_g3', gender: 'MALE', gen: 3, name: 'Роман Петров', label: 'Могилёв, 2007 г.' },
  { key: 'oksana_g3', gender: 'FEMALE', gen: 3, name: 'Оксана Петрова', label: 'Могилёв, 2009 г.' },

  // Generation 4 (Born ~2007-2013, all L, kids)
  { key: 'timur_g4', gender: 'MALE', gen: 4, name: 'Тимур Морозов', label: 'Минск, 2024 г.' },
  { key: 'polina_g4', gender: 'FEMALE', gen: 4, name: 'Полина Морозова', label: 'Минск, 2025 г.' },
  { key: 'nikita_g4', gender: 'MALE', gen: 4, name: 'Никита Морозов', label: 'Минск, 2026 г.' },
  { key: 'maksim_g4', gender: 'MALE', gen: 4, name: 'Максим Соколов', label: 'Минск, 2024 г.' },
  { key: 'veronika_g4', gender: 'FEMALE', gen: 4, name: 'Вероника Соколова', label: 'Минск, 2025 г.' },
  { key: 'gleb_g4', gender: 'MALE', gen: 4, name: 'Глеб Соколов', label: 'Минск, 2026 г.' },
  { key: 'kirill_g4', gender: 'MALE', gen: 4, name: 'Кирилл Волков', label: 'Витебск, 2024 г.' },
  { key: 'alisa_g4', gender: 'FEMALE', gen: 4, name: 'Алиса Волкова', label: 'Витебск, 2025 г.' },
  { key: 'egor_g4', gender: 'MALE', gen: 4, name: 'Егор Волков', label: 'Витебск, 2026 г.' },
  { key: 'eva_g4', gender: 'FEMALE', gen: 4, name: 'Ева Петрова', label: 'Могилёв, 2025 г.' },
  { key: 'vladislav_g4', gender: 'MALE', gen: 4, name: 'Владислав Петров', label: 'Могилёв, 2026 г.' },
  { key: 'sofia_g4', gender: 'FEMALE', gen: 4, name: 'София Петрова', label: 'Могилёв, 2026 г.' }
];

// Helper to determine if deceased
function isDeceased(person) {
  if (person.deceased !== undefined) return person.deceased;
  return person.gen <= 1; // Gen 0 and 1 are all deceased
}

// Generate stylized SVG code
function makeSvg(person, type, index) {
  const isM = person.gender === 'MALE';
  const gen = person.gen;
  const dec = isDeceased(person);

  // Colors based on generation/style
  let bgStart, bgEnd, paperColor, textColor, lineStroke, filterSvg = '';
  let hairColor = '#4a3728'; // Default brown
  
  if (gen === 0 || gen === 1) {
    // Gen0: Sepia, Gen1: Grayscale
    const isSepia = gen === 0;
    bgStart = isSepia ? '#e6d8b8' : '#e0e0e0';
    bgEnd = isSepia ? '#c8b594' : '#b0b0b0';
    paperColor = isSepia ? '#f4ecd8' : '#f0f0f0';
    textColor = isSepia ? '#5c4327' : '#333333';
    lineStroke = isSepia ? '#8c6b45' : '#777777';
    hairColor = isM ? '#7d7d7d' : '#9c9c9c'; // grey/white hair for older ancestors
    
    filterSvg = isSepia
      ? `<filter id="vintage">
           <feColorMatrix type="matrix" values="0.393 0.769 0.189 0 0  0.349 0.686 0.168 0 0  0.272 0.534 0.131 0 0  0 0 0 1 0"/>
           <feComponentTransfer><feFuncR type="linear" slope="0.95"/><feFuncG type="linear" slope="0.9"/><feFuncB type="linear" slope="0.8"/></feComponentTransfer>
         </filter>`
      : `<filter id="vintage">
           <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0"/>
         </filter>`;
  } else if (gen === 2) {
    // 70s faded analog film look
    bgStart = '#dfcca0';
    bgEnd = '#c4a682';
    paperColor = '#fdfbf7';
    textColor = '#4a2f15';
    lineStroke = '#aa7f55';
    hairColor = '#3d2516';
    filterSvg = `<filter id="vintage">
                   <feColorMatrix type="matrix" values="0.9 0.1 0 0 0  0.05 0.85 0.1 0 0  0 0.15 0.75 0 0  0 0 0 1 0"/>
                   <feComponentTransfer><feFuncR type="linear" slope="1.05"/><feFuncB type="linear" slope="0.9"/></feComponentTransfer>
                 </filter>`;
  } else if (gen === 3) {
    // 90s Polaroid/Disposable camera look
    bgStart = '#cbd5e1';
    bgEnd = '#94a3b8';
    paperColor = '#ffffff';
    textColor = '#1e293b';
    lineStroke = '#64748b';
    hairColor = isM ? '#27272a' : '#b45309'; // black/blonde hair
  } else {
    // Modern digital vector look
    bgStart = isM ? '#38bdf8' : '#f472b6';
    bgEnd = isM ? '#0369a1' : '#be185d';
    paperColor = '#ffffff';
    textColor = '#0f172a';
    lineStroke = '#475569';
    hairColor = isM ? '#18181b' : '#7c2d12';
  }

  // Draw face details
  const headColor = '#ffdbac'; // standard skin tone
  const eyeY = 175;
  const eyeRadius = 6;
  const mouthY = 215;

  let hairSvg = '';
  if (isM) {
    // Male Hair & Eyebrows
    hairSvg = `
      <!-- Hair -->
      <path d="M 150 140 Q 200 110 250 140 Q 255 160 250 180 Q 240 182 235 170 Q 200 150 165 170 Q 160 182 150 180 Z" fill="${hairColor}" />
      <!-- Eyebrows -->
      <path d="M 165 162 Q 177 155 190 162" stroke="${hairColor}" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M 210 162 Q 223 155 235 162" stroke="${hairColor}" stroke-width="3" fill="none" stroke-linecap="round" />
    `;
    if (gen <= 1) {
      // Old-gen mustache
      hairSvg += `<path d="M 180 207 Q 200 200 220 207 Q 200 213 180 207" fill="${hairColor}" />`;
    }
  } else {
    // Female Hair & Eyebrows
    hairSvg = `
      <!-- Long Hair Background -->
      <path d="M 140 160 C 130 220 135 280 145 320 C 150 280 155 220 150 160 Z" fill="${hairColor}" />
      <path d="M 260 160 C 270 220 265 280 255 320 C 250 280 245 220 250 160 Z" fill="${hairColor}" />
      <!-- Main Hair top -->
      <path d="M 145 155 Q 200 115 255 155 Q 265 210 250 210 Q 240 190 230 180 Q 200 165 170 180 Q 160 190 150 210 Q 135 210 145 155 Z" fill="${hairColor}" />
      <!-- Eyebrows -->
      <path d="M 168 164 Q 178 158 188 164" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <path d="M 212 164 Q 222 158 232 164" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round" />
    `;
  }

  // Glasses for librarians or teachers (e.g. Tatiana, Anna, Mikhail)
  let accessoriesSvg = '';
  if (person.name.includes('Татьяна') || person.name.includes('Михаил') || (gen === 0 && index % 2 === 0)) {
    accessoriesSvg = `
      <!-- Glasses -->
      <circle cx="182" cy="175" r="16" stroke="${lineStroke}" stroke-width="2.5" fill="none" />
      <circle cx="218" cy="175" r="16" stroke="${lineStroke}" stroke-width="2.5" fill="none" />
      <line x1="198" y1="175" x2="202" y2="175" stroke="${lineStroke}" stroke-width="2.5" />
      <line x1="166" y1="175" x2="160" y2="178" stroke="${lineStroke}" stroke-width="2.5" />
      <line x1="234" y1="175" x2="240" y2="178" stroke="${lineStroke}" stroke-width="2.5" />
    `;
  }

  // Unique elements for secondary content photos (e.g. books, trees, factories, scales)
  let contentDecorationSvg = '';
  if (type === 'photo_1') {
    contentDecorationSvg = `
      <!-- Book icon or simple retro decorative banner -->
      <rect x="30" y="30" width="340" height="28" fill="${textColor}15" rx="4" />
      <text x="50" y="48" font-family="'Lora', serif" font-size="12" fill="${textColor}" letter-spacing="1">ИЗ АРХИВА СЕМЬИ</text>
      <circle cx="340" cy="44" r="5" fill="${lineStroke}" />
    `;
  } else if (type === 'photo_2') {
    contentDecorationSvg = `
      <!-- Landscape tree/flowers overlay for hobbies/career -->
      <path d="M 30 310 Q 70 290 120 310 Q 170 330 220 310 T 370 310" stroke="${lineStroke}55" stroke-width="2" fill="none" />
      <circle cx="330" cy="70" r="15" fill="#fef08a" opacity="0.3" />
    `;
  }

  // Final SVG assembly
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgStart}" />
          <stop offset="100%" stop-color="${bgEnd}" />
        </linearGradient>
        ${filterSvg}
      </defs>
      
      <g ${filterSvg ? 'filter="url(#vintage)"' : ''}>
        <!-- Polaroid/Photo Frame base -->
        <rect x="10" y="10" width="380" height="380" fill="${paperColor}" rx="12" stroke="#e2e8f0" stroke-width="1" />
        
        <!-- Photo Image Area -->
        <rect x="25" y="25" width="350" height="300" fill="url(#bg)" rx="8" />
        
        <!-- Background elements -->
        <circle cx="200" cy="200" r="120" fill="#ffffff" opacity="0.1" />
        <circle cx="100" cy="100" r="60" fill="#ffffff" opacity="0.05" />
        
        <!-- Decoration from photo type -->
        ${contentDecorationSvg}
        
        <!-- Person Silhoutte -->
        <!-- Shoulders / Clothes -->
        <path d="M 120 325 C 120 280 150 250 200 250 C 250 250 280 280 280 325 Z" fill="${isM ? '#2b5c8f' : '#8f2b5c'}" />
        <!-- Collar -->
        <path d="M 175 250 L 200 270 L 225 250" stroke="${headColor}" stroke-width="3" fill="none" />
        
        <!-- Neck -->
        <rect x="185" y="220" width="30" height="35" fill="${headColor}" rx="4" />
        
        <!-- Head -->
        <ellipse cx="200" cy="185" rx="50" ry="55" fill="${headColor}" />
        
        <!-- Facial features -->
        <!-- Eyes -->
        <circle cx="182" cy="${eyeY}" r="${eyeRadius}" fill="${textColor}" />
        <circle cx="218" cy="${eyeY}" r="${eyeRadius}" fill="${textColor}" />
        <circle cx="184" cy="${eyeY - 2}" r="2" fill="#ffffff" />
        <circle cx="220" cy="${eyeY - 2}" r="2" fill="#ffffff" />
        
        <!-- Nose -->
        <path d="M 200 180 L 196 200 L 204 200" fill="${textColor}" opacity="0.15" />
        
        <!-- Mouth -->
        <path d="M 185 ${mouthY} Q 200 ${mouthY + 12} 215 ${mouthY}" stroke="${textColor}" stroke-width="3" fill="none" stroke-linecap="round" />
        
        <!-- Hair -->
        ${hairSvg}
        
        <!-- Accessories -->
        ${accessoriesSvg}
        
        <!-- Label area (Polaroid style) -->
        <text x="200" y="358" font-family="'Lora', serif" font-weight="600" font-size="16" fill="${textColor}" text-anchor="middle">${person.name}</text>
        <text x="200" y="376" font-family="'Inter', sans-serif" font-size="10" fill="${textColor}" opacity="0.75" letter-spacing="1.5" text-anchor="middle">${person.label}</text>
      </g>
    </svg>
  `;
  return svg;
}

// Main execution block
async function main() {
  console.log('🧹 Cleaning old WebP/PNG uploads...');
  const files = fs.readdirSync(UPLOADS_DIR);
  let deletedCount = 0;
  for (const file of files) {
    if (file === '.gitkeep') continue;
    fs.unlinkSync(path.join(UPLOADS_DIR, file));
    deletedCount++;
  }
  console.log(`✅ Cleaned ${deletedCount} files.`);

  console.log('🎨 Generating 85 unique photo/portrait files...');
  
  let count = 0;
  for (let i = 0; i < PEOPLE_SPECS.length; i++) {
    const p = PEOPLE_SPECS[i];
    const dec = isDeceased(p);
    
    // 1. Generate Avatar / Portrait
    const avatarSvg = makeSvg(p, 'avatar', i);
    const avatarPath = path.join(UPLOADS_DIR, `avatar_${p.key}.webp`);
    await sharp(Buffer.from(avatarSvg))
      .webp({ quality: 85 })
      .toFile(avatarPath);
    count++;
    
    // 2. Generate content photos if deceased
    if (dec) {
      const p1Svg = makeSvg(p, 'photo_1', i);
      const p1Path = path.join(UPLOADS_DIR, `photo_${p.key}_1.webp`);
      await sharp(Buffer.from(p1Svg))
        .webp({ quality: 85 })
        .toFile(p1Path);
      count++;
      
      const p2Svg = makeSvg(p, 'photo_2', i);
      const p2Path = path.join(UPLOADS_DIR, `photo_${p.key}_2.webp`);
      await sharp(Buffer.from(p2Svg))
        .webp({ quality: 85 })
        .toFile(p2Path);
      count++;
    }
  }
  
  console.log(`🎉 Finished generating all ${count} unique photos under backend/uploads/.`);
}

main().catch(err => {
  console.error('FATAL PORTRAIT GENERATION ERROR:', err);
  process.exit(1);
});
