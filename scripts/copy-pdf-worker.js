import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.resolve(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js');
const dest = path.resolve(__dirname, '../dist/pdf.worker.min.js');

// Create dist directory if it doesn't exist
const distDir = path.dirname(dest);
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy worker file
try {
  fs.copyFileSync(src, dest);
  console.log('✅ PDF.js worker copied to dist/');
} catch (error) {
  console.error('❌ Failed to copy PDF.js worker:', error.message);
  process.exit(1);
}
