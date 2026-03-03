# CareerOS Chrome Extension

## Installation (Developer Mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `/extension` folder

## Usage

- Navigate to any job listing page (LinkedIn, Greenhouse, Lever, Workday, etc.)
- Click the CareerOS extension icon in your toolbar
- Job info is auto-detected — edit title/company if needed
- Click "Save Job" to add to your tracker

## Notes

- Jobs saved from the extension are stored in `chrome.storage.local` under the key `job_tracker_jobs`
- The main CareerOS app reads from the same key
- To sync extension jobs to the main app, both must be open (or the app must read from chrome.storage)

## Icon Placeholder

The extension references icon16.png, icon48.png, icon128.png.
Create simple placeholder PNG files or use any 16x16, 48x48, 128x128 PNG icons.
