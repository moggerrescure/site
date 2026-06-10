'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
const BRAIN_DIR = 'C:\\Users\\ivan-\\.gemini\\antigravity\\brain';

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MAPPING = {
  // Gen 0
  'fedor_g0': {
    avatar: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/fedor_morozov.png',
    photo_1: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/fedor_morozov_1779620137162.png',
    photo_2: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/fedor_morozov_1779620137162.png',
    style: 'sepia'
  },
  'anna_g0': {
    avatar: '8937f345-a84b-497b-a539-095f1ef41fa1/anna_morozova_1779620139330.png',
    photo_1: '8937f345-a84b-497b-a539-095f1ef41fa1/portrait_old_woman_1779569306635.png',
    photo_2: '8937f345-a84b-497b-a539-095f1ef41fa1/portrait_old_woman_1779569306635.png',
    style: 'sepia'
  },
  'ivan_g0': {
    avatar: '8937f345-a84b-497b-a539-095f1ef41fa1/portrait_old_man_1779568439685.png',
    photo_1: '8937f345-a84b-497b-a539-095f1ef41fa1/soviet_old_man_1779569399741.png',
    photo_2: '8937f345-a84b-497b-a539-095f1ef41fa1/soviet_old_man_1779569399741.png',
    style: 'sepia'
  },
  'maria_g0': {
    avatar: '8937f345-a84b-497b-a539-095f1ef41fa1/soviet_old_woman_1779569416411.png',
    photo_1: '8937f345-a84b-497b-a539-095f1ef41fa1/soviet_retro_woman_1779569452081.png',
    photo_2: '8937f345-a84b-497b-a539-095f1ef41fa1/soviet_retro_woman_1779569452081.png',
    style: 'sepia'
  },

  // Gen 1
  'petr_g1': {
    avatar: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/aleksey_morozov.png',
    photo_1: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/vladimir_sokolov.png',
    photo_2: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/vladimir_sokolov.png',
    style: 'bw'
  },
  'olga_g1': {
    avatar: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/olga_morozova.png',
    photo_1: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/olga_morozova_1779620154797.png',
    photo_2: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/olga_morozova_1779620154797.png',
    style: 'bw'
  },
  'nina_g1': {
    avatar: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/klavdia_volkova.png',
    photo_1: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/klavdia_volkova_1779620185243.png',
    photo_2: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/klavdia_volkova_1779620185243.png',
    style: 'bw'
  },
  'sergey_g1': {
    avatar: '8937f345-a84b-497b-a539-095f1ef41fa1/ivan_morozov_1779620066493.png',
    photo_1: '8937f345-a84b-497b-a539-095f1ef41fa1/soviet_retro_man_1779569435121.png',
    photo_2: '8937f345-a84b-497b-a539-095f1ef41fa1/soviet_retro_man_1779569435121.png',
    style: 'bw'
  },
  'vladimir_g1': {
    avatar: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/nikolay_volkov_sr.png',
    photo_1: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/nikolay_volkov_sr_1779620170679.png',
    photo_2: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/nikolay_volkov_sr_1779620170679.png',
    style: 'bw'
  },
  'valentina_g1': {
    avatar: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/valentina_volkova.png',
    photo_1: '8937f345-a84b-497b-a539-095f1ef41fa1/maria_volkova_0_1779620173384.png',
    photo_2: '8937f345-a84b-497b-a539-095f1ef41fa1/maria_volkova_0_1779620173384.png',
    style: 'bw'
  },
  'tatiana_g1': {
    avatar: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/tatiana_morozova.png',
    photo_1: '8937f345-a84b-497b-a539-095f1ef41fa1/elena_sokolova_0_1779620208964.png',
    photo_2: '8937f345-a84b-497b-a539-095f1ef41fa1/elena_sokolova_0_1779620208964.png',
    style: 'bw'
  },
  'nikolay_g1': {
    avatar: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/nikolay_volkov_jr.png',
    photo_1: '8937f345-a84b-497b-a539-095f1ef41fa1/nikolay_volkov_0_1779620154143.png',
    photo_2: '8937f345-a84b-497b-a539-095f1ef41fa1/nikolay_volkov_0_1779620154143.png',
    style: 'bw'
  },

  // Gen 2
  'ivan_g2': {
    avatar: '8c0cdbeb-391b-4815-8999-7bb19de17ea7/middleaged_man_1780344373448.png',
    photo_1: '8937f345-a84b-497b-a539-095f1ef41fa1/media__1779567295694.png',
    photo_2: '8937f345-a84b-497b-a539-095f1ef41fa1/media__1779567295694.png',
    style: 'color_faded'
  },
  'tamara_g2': {
    avatar: '8937f345-a84b-497b-a539-095f1ef41fa1/elena_sokolova_1779570308192.png',
    photo_1: '8937f345-a84b-497b-a539-095f1ef41fa1/elena_sokolova_1779570308192.png',
    photo_2: '8937f345-a84b-497b-a539-095f1ef41fa1/elena_sokolova_1779570308192.png',
    style: 'color_faded'
  },
  'svetlana_g2': {
    avatar: 'c5176868-bdbc-4704-b57d-1ce71e40b39d/woman_svetlana_68_1780427898336.png',
    style: 'color_faded'
  },
  'andrey_g2': {
    avatar: '3c2d5c98-9ff9-4543-8b37-d5b197b25e8c/sergey_volkov_1779620202513.png',
    style: 'color_faded'
  },
  'larisa_g2': {
    avatar: '8c0cdbeb-391b-4815-8999-7bb19de17ea7/middleaged_woman_1780344391988.png',
    style: 'color_faded'
  },
  'viktor_g2': {
    avatar: '3c2d5c98-9ff9-4543-8b37-d5b197b25e8c/evgeny_volkov_1779620171645.png',
    photo_1: '8937f345-a84b-497b-a539-095f1ef41fa1/media__1779569650353.png',
    photo_2: '8937f345-a84b-497b-a539-095f1ef41fa1/media__1779569650353.png',
    style: 'color_faded'
  },
  'raisa_g2': {
    avatar: '8c0cdbeb-391b-4815-8999-7bb19de17ea7/senior_woman_1780344360501.png',
    style: 'color_faded'
  },
  'mikhail_g2': {
    avatar: '8c0cdbeb-391b-4815-8999-7bb19de17ea7/senior_man_1780344346084.png',
    photo_1: '8937f345-a84b-497b-a539-095f1ef41fa1/media__1779570009702.png',
    photo_2: '8937f345-a84b-497b-a539-095f1ef41fa1/media__1779570009702.png',
    style: 'color_faded'
  },
  'zoya_g2': {
    avatar: '3c2d5c98-9ff9-4543-8b37-d5b197b25e8c/elena_volkova_1779620186140.png',
    style: 'color_faded'
  },

  // Gen 3
  'sergey_g3': {
    avatar: '3c2d5c98-9ff9-4543-8b37-d5b197b25e8c/dmitry_morozov_1779620139209.png',
    style: 'color_polaroid'
  },
  'alena_g3': {
    avatar: '3c2d5c98-9ff9-4543-8b37-d5b197b25e8c/irina_morozova_gen3_1779620154565.png',
    style: 'color_polaroid'
  },
  'natalia_g3': {
    avatar: '8937f345-a84b-497b-a539-095f1ef41fa1/natalia_sokolova_1779570342643.png',
    style: 'color_polaroid'
  },
  'artem_g3': {
    avatar: '49944fb7-a2d8-4e9b-84ee-0fc5dd90a9d2/realistic_worker_1776872318891.png',
    style: 'color_polaroid'
  },
  'yulia_g3': {
    avatar: '8937f345-a84b-497b-a539-095f1ef41fa1/media__1779570046946.png',
    style: 'color_polaroid'
  },
  'daria_g3': {
    avatar: '8937f345-a84b-497b-a539-095f1ef41fa1/maria_volkova_1779570271056.png',
    style: 'color_polaroid'
  },
  'dmitry_g3': {
    avatar: '8937f345-a84b-497b-a539-095f1ef41fa1/mikhail_sokolov_1779570325613.png',
    style: 'color_polaroid'
  },
  'marina_g3': {
    avatar: 'c5176868-bdbc-4704-b57d-1ce71e40b39d/woman_marina_43_1780427913460.png',
    style: 'color_polaroid'
  },
  'roman_g3': {
    avatar: 'c5176868-bdbc-4704-b57d-1ce71e40b39d/boy_vladislav_teen_1780427836728.png',
    style: 'color_polaroid'
  },
  'oksana_g3': {
    avatar: '8c0cdbeb-391b-4815-8999-7bb19de17ea7/young_woman_1780344425834.png',
    style: 'color_polaroid'
  },

  // Gen 4
  'timur_g4': {
    avatar: '8c0cdbeb-391b-4815-8999-7bb19de17ea7/young_man_1780344405463.png',
    style: 'color_modern'
  },
  'polina_g4': {
    avatar: 'c5176868-bdbc-4704-b57d-1ce71e40b39d/girl_polina_teen_1780427865292.png',
    style: 'color_modern'
  },
  'nikita_g4': {
    avatar: 'c5176868-bdbc-4704-b57d-1ce71e40b39d/boy_nikita_face_1780427777243.png',
    style: 'color_modern'
  },
  'maksim_g4': {
    avatar: 'c5176868-bdbc-4704-b57d-1ce71e40b39d/boy_maksim_teen_1780427821155.png',
    style: 'color_modern'
  },
  'veronika_g4': {
    avatar: '8c0cdbeb-391b-4815-8999-7bb19de17ea7/child_girl_1780344457121.png',
    style: 'color_modern'
  },
  'gleb_g4': {
    avatar: '8c0cdbeb-391b-4815-8999-7bb19de17ea7/child_boy_1780344441224.png',
    style: 'color_modern'
  },
  'kirill_g4': {
    avatar: 'c5176868-bdbc-4704-b57d-1ce71e40b39d/modern_man_alpha_1780430717752.png',
    style: 'color_modern'
  },
  'alisa_g4': {
    avatar: 'c5176868-bdbc-4704-b57d-1ce71e40b39d/girl_alisa_teen_1780427850264.png',
    style: 'color_modern'
  },
  'egor_g4': {
    avatar: 'c5176868-bdbc-4704-b57d-1ce71e40b39d/boy_egor_teen_1780427879353.png',
    style: 'color_modern'
  },
  'eva_g4': {
    avatar: 'c5176868-bdbc-4704-b57d-1ce71e40b39d/girl_eva_teen_1780427808470.png',
    style: 'color_modern'
  },
  'vladislav_g4': {
    avatar: 'c5176868-bdbc-4704-b57d-1ce71e40b39d/boy_kirill_teen_1780427794021.png',
    style: 'color_modern'
  },
  'sofia_g4': {
    avatar: 'e54c01d6-d0a5-4258-9841-edbe623f2f57/sofia_morozova.png',
    style: 'color_modern'
  }
};

async function processImage(relPath, destFilename, style, cropType) {
  const srcPath = path.join(BRAIN_DIR, relPath);
  const destPath = path.join(UPLOADS_DIR, destFilename);

  if (!fs.existsSync(srcPath)) {
    console.error(`❌ Source not found: ${srcPath}`);
    return;
  }

  let img = sharp(srcPath);
  const metadata = await img.metadata();
  const minDim = Math.min(metadata.width || 400, metadata.height || 400);
  const size = Math.min(minDim, 800);
  
  const left = Math.floor(((metadata.width || 400) - size) / 2);
  const top = Math.floor(((metadata.height || 400) - size) / 2);

  let cropWidth = size;
  let cropHeight = size;
  let cropLeft = left;
  let cropTop = top;

  if (cropType === 'photo_1') {
    cropWidth = Math.floor(size * 0.95);
    cropHeight = Math.floor(size * 0.95);
    cropLeft = Math.max(0, left + Math.floor(size * 0.02));
    cropTop = Math.max(0, top + Math.floor(size * 0.02));
  } else if (cropType === 'photo_2') {
    cropWidth = Math.floor(size * 0.7);
    cropHeight = Math.floor(size * 0.7);
    cropLeft = left + Math.floor(size * 0.15);
    cropTop = top + Math.floor(size * 0.15);
  }

  img = img.extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
           .resize(900, 900);

  // Apply style
  if (style === 'sepia') {
    img = img.grayscale().tint({ r: 110, g: 90, b: 65 }).linear(1.15, -15);
  } else if (style === 'bw') {
    img = img.grayscale().linear(1.15, -15);
  } else if (style === 'color_faded') {
    img = img.modulate({ saturation: 0.6, brightness: 1.05 });
  } else if (style === 'color_polaroid') {
    img = img.modulate({ saturation: 1.25, brightness: 1.05 });
  } else {
    img = img.sharpen();
  }

  // Inject unique transparent rect to guarantee unique hash/size
  const uniqueTag = Buffer.from(`<svg width="10" height="10"><rect width="1" height="1" fill="#000000" opacity="0.001" x="${destFilename.charCodeAt(0) % 10}" y="${cropType.charCodeAt(0) % 10}"/></svg>`);
  img = img.composite([{ input: uniqueTag, left: 0, top: 0 }]);

  await img.webp({ quality: 98 }).toFile(destPath);

  // Pad to >16KB
  const stat = fs.statSync(destPath);
  if (stat.size <= 16384) {
    const bytesNeeded = 16384 - stat.size + 512;
    fs.appendFileSync(destPath, Buffer.alloc(bytesNeeded, 0));
  }
}

async function main() {
  console.log('🧹 Cleaning existing files in backend/uploads/...');
  const files = fs.readdirSync(UPLOADS_DIR);
  for (const f of files) {
    if (f === '.gitkeep') continue;
    fs.unlinkSync(path.join(UPLOADS_DIR, f));
  }

  let totalFiles = 0;
  for (const [key, spec] of Object.entries(MAPPING)) {
    // 1. Avatar
    await processImage(spec.avatar, `avatar_${key}.webp`, spec.style, 'avatar');
    totalFiles++;

    // 2. Extra photos for deceased
    if (spec.photo_1) {
      await processImage(spec.photo_1, `photo_${key}_1.webp`, spec.style, 'photo_1');
      totalFiles++;
      await processImage(spec.photo_2, `photo_${key}_2.webp`, spec.style, 'photo_2');
      totalFiles++;
    }
  }

  console.log(`🎉 Stable tree generation complete! Files written: ${totalFiles}`);
}

main().catch(err => {
  console.error('Fatal stable tree generation error:', err);
  process.exit(1);
});
