const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const zip = new AdmZip();
const outputZip = path.join(__dirname, '..', 'erosae_source.zip');

if (fs.existsSync(outputZip)) {
  fs.unlinkSync(outputZip);
}

const rootFiles = [
  'package.json',
  'package-lock.json',
  'next.config.js',
  'tsconfig.json',
  'tailwind.config.js',
  'postcss.config.js',
  'ecosystem.config.js',
  '.env',
];

for (const file of rootFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    zip.addLocalFile(filePath);
    console.log(`Added file: ${file}`);
  }
}

const rootDirs = ['prisma', 'public', 'src', 'scripts'];

for (const dir of rootDirs) {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    zip.addLocalFolder(dirPath, dir);
    console.log(`Added directory: ${dir}`);
  }
}

zip.writeZip(outputZip);
console.log(`Successfully wrote ${outputZip} (${(fs.statSync(outputZip).size / 1024 / 1024).toFixed(2)} MB)`);
