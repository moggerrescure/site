const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convert() {
  console.log('Starting image conversion...');
  
  const img1Source = path.join(__dirname, 'vladimir_plan.png');
  const img1Target = path.join(__dirname, 'uploads', 'photo_vladimir_g1_1.webp');

  const img2Source = path.join(__dirname, 'vladimir_institute.png');
  const img2Target = path.join(__dirname, 'uploads', 'photo_vladimir_g1_2.webp');

  if (fs.existsSync(img1Source)) {
    await sharp(img1Source)
      .resize(900, 900, { fit: 'cover' })
      .toFormat('webp', { quality: 85 })
      .toFile(img1Target);
    console.log(`Converted vladimir_plan.png -> uploads/photo_vladimir_g1_1.webp (Gomel Plan)`);
    fs.unlinkSync(img1Source);
  } else {
    console.error('vladimir_plan.png not found!');
  }

  if (fs.existsSync(img2Source)) {
    await sharp(img2Source)
      .resize(900, 900, { fit: 'cover' })
      .toFormat('webp', { quality: 85 })
      .toFile(img2Target);
    console.log(`Converted vladimir_institute.png -> uploads/photo_vladimir_g1_2.webp (Construction Institute)`);
    fs.unlinkSync(img2Source);
  } else {
    console.error('vladimir_institute.png not found!');
  }

  console.log('Image conversion completed successfully.');
}

convert().catch(err => {
  console.error('Error during conversion:', err);
  process.exit(1);
});
