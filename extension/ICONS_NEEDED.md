# Icons Setup

The extension requires three PNG icon files that are referenced in `manifest.json`:

- `icon16.png` (16x16 px)
- `icon48.png` (48x48 px)
- `icon128.png` (128x128 px)

## Option 1 — Generate placeholder icons (quickest)

Run this once from the `/extension` directory:

```bash
node create-icons.js
```

This creates minimal valid 1x1 placeholder PNGs so Chrome can load the extension.
The `canvas` npm package is optional — the script falls back to base64-encoded stubs automatically.

## Option 2 — Use your own icons

Drop any 16x16, 48x48, and 128x128 PNG files into this folder named exactly:
- `icon16.png`
- `icon48.png`
- `icon128.png`

## Option 3 — Quick one-liner (no npm needed)

```bash
node -e "
const fs = require('fs');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync('icon16.png', png);
fs.writeFileSync('icon48.png', png);
fs.writeFileSync('icon128.png', png);
console.log('Icons created');
"
```
