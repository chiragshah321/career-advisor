// Content script: runs on the CareerOS app page before the app initializes.
// Bridges jobs saved by the extension popup (chrome.storage.local) into the
// app's localStorage, which is where Zustand persist reads from.

const STORAGE_KEY = 'job_tracker_jobs';

chrome.storage.local.get([STORAGE_KEY], (result) => {
  const raw = result[STORAGE_KEY];
  if (!raw) return;

  try {
    const incoming = (typeof raw === 'string' ? JSON.parse(raw) : raw)?.state?.jobs ?? [];
    if (!incoming.length) return;

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const existingJobs = existing?.state?.jobs ?? [];

    const existingIds = new Set(existingJobs.map((j) => j.id));
    const existingUrls = new Set(existingJobs.map((j) => j.url));
    const newJobs = incoming.filter((j) => !existingIds.has(j.id) && !existingUrls.has(j.url));

    if (!newJobs.length) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...existing,
      state: { jobs: [...newJobs, ...existingJobs] },
    }));

    chrome.storage.local.remove(STORAGE_KEY);
  } catch (e) {
    console.error('[CareerOS] sync error:', e);
  }
});
