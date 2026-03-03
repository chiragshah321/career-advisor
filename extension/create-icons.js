// Run: node create-icons.js
// Creates placeholder PNG icons for the extension
const { createCanvas } = require('canvas');
const fs = require('fs');

// If canvas not available, create minimal valid 1x1 PNGs
const PNG_1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync('icon16.png', PNG_1x1);
fs.writeFileSync('icon48.png', PNG_1x1);
fs.writeFileSync('icon128.png', PNG_1x1);
console.log('Icons created (placeholder 1x1 PNGs)');
