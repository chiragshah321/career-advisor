const STORAGE_KEY = 'job_tracker_jobs';
const QUICKLINKS_KEY = 'job_tracker_quicklinks';
const APP_URL = 'https://app-black-six-21.vercel.app';

function getQuickLinks(callback) {
  chrome.storage.local.get([QUICKLINKS_KEY], (result) => {
    try {
      const raw = result[QUICKLINKS_KEY];
      const links = raw ? JSON.parse(raw) : [];
      callback(Array.isArray(links) ? links : []);
    } catch {
      callback([]);
    }
  });
}

async function openTabGroup(links) {
  if (!links.length) return;
  const tabIds = [];
  for (const link of links) {
    const tab = await chrome.tabs.create({ url: link.url, active: false });
    tabIds.push(tab.id);
  }
  const groupId = await chrome.tabs.group({ tabIds });
  await chrome.tabGroups.update(groupId, { title: 'Job Search', color: 'teal', collapsed: false });
  chrome.tabs.update(tabIds[0], { active: true });
  window.close();
}

function renderQuickLinks(links) {
  const section = document.getElementById('quick-links-section');
  const list = document.getElementById('quick-links-list');
  const count = document.getElementById('quick-links-count');
  const btn = document.getElementById('open-tab-group-btn');
  const noLinks = document.getElementById('no-quick-links');

  section.classList.remove('hidden');
  count.textContent = links.length;

  if (links.length === 0) {
    btn.classList.add('hidden');
    noLinks.classList.remove('hidden');
    return;
  }

  noLinks.classList.add('hidden');
  btn.classList.remove('hidden');

  list.innerHTML = links.map((l) =>
    `<div class="quick-link-item"><span class="quick-link-dot"></span>${l.name}</div>`
  ).join('');

  btn.addEventListener('click', () => openTabGroup(links));
}

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '00')}`;
}

function show(id) {
  document.querySelectorAll('.state, #form-container').forEach(el => el.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

async function getTabInfo() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab) { resolve({ url: '', title: '', company: '' }); return; }

      // Inject script to extract page meta
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Try to detect company from various meta tags and page content
          const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
          const twitterSite = document.querySelector('meta[name="twitter:site"]')?.getAttribute('content')?.replace('@', '');
          const h1 = document.querySelector('h1')?.textContent?.trim();

          // Try to extract company from title (common formats: "Job Title at Company | Site")
          const titleText = document.title;
          let company = '';
          const atMatch = titleText.match(/ at ([^|–-]+)/i);
          if (atMatch) company = atMatch[1].trim();
          else if (ogSiteName) company = ogSiteName;
          else if (twitterSite) company = twitterSite;

          // Try to get job title from og:title or h1
          const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
          const jobTitle = ogTitle || h1 || document.title;

          // Extract job description from common selectors
          const descSelectors = [
            '[data-testid="job-description"]',
            '#job-description',
            '.job-description',
            '#jobDescriptionText',          // Indeed
            '.jobs-description__content',  // LinkedIn
            '.description__text',          // LinkedIn alt
            '.posting-content',            // Lever
            '[class*="jobDescription"]',
            '[class*="job-details"]',
            'article',
          ];
          let description = '';
          for (const sel of descSelectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim().length > 100) {
              description = el.innerText.trim();
              break;
            }
          }
          // Fallback: largest block of text under 15k chars
          if (!description) {
            let maxLen = 0;
            document.querySelectorAll('section, main, .content, [class*="content"]').forEach((el) => {
              const t = el.innerText?.trim() || '';
              if (t.length > maxLen && t.length < 15000) { maxLen = t.length; description = t; }
            });
          }

          return { company, jobTitle, description: description.slice(0, 4000) };
        }
      }, (results) => {
        const extracted = results?.[0]?.result ?? {};
        resolve({
          url: tab.url ?? '',
          title: tab.title ?? '',
          extractedTitle: extracted.jobTitle ?? tab.title ?? '',
          extractedCompany: extracted.company ?? '',
          extractedDescription: extracted.description ?? '',
        });
      });
    });
  });
}

function getJobs() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return parsed?.state?.jobs ?? [];
  } catch {
    return [];
  }
}

function saveJobs(jobs) {
  const current = localStorage.getItem(STORAGE_KEY);
  let existing = {};
  try { existing = JSON.parse(current) ?? {}; } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, state: { jobs } }));
}

// Extension uses chrome.storage.local as the shared bridge
// The app uses localStorage via Zustand persist, so we write to the same format
// But extensions can't access page localStorage — we use chrome.storage.local instead
// and the app will need to check chrome.storage if available.
// For simplicity, we'll use chrome.storage.local with the same key structure.

function getChromeJobs(callback) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const data = result[STORAGE_KEY];
    if (!data) { callback([]); return; }
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      callback(parsed?.state?.jobs ?? []);
    } catch {
      callback([]);
    }
  });
}

function saveToChromeStorage(jobs) {
  const data = JSON.stringify({ state: { jobs } });
  chrome.storage.local.set({ [STORAGE_KEY]: data });
}

document.addEventListener('DOMContentLoaded', async () => {
  show('loading');

  const tabInfo = await getTabInfo();
  const url = tabInfo.url;

  // Populate form fields
  const titleInput = document.getElementById('job-title');
  const companyInput = document.getElementById('company');
  const urlInput = document.getElementById('job-url');

  // Clean up extracted title — remove company suffix if present
  let cleanTitle = tabInfo.extractedTitle;
  const atIdx = cleanTitle.indexOf(' at ');
  if (atIdx > 0) cleanTitle = cleanTitle.substring(0, atIdx).trim();
  // Remove site name suffixes
  cleanTitle = cleanTitle.replace(/\s*[|–-].*$/, '').trim();

  titleInput.value = cleanTitle;
  companyInput.value = tabInfo.extractedCompany;
  urlInput.value = url;

  // Check if already saved
  getChromeJobs((jobs) => {
    const existing = jobs.find((j) => j.url === url);
    if (existing) {
      document.getElementById('saved-company').textContent = `${existing.title} at ${existing.company}`;
      document.getElementById('view-in-app').href = APP_URL + '/jobs';
      show('already-saved');
    } else {
      show('form-container');
    }
  });

  // View in app links
  document.getElementById('view-in-app-success').href = APP_URL + '/jobs';

  // Quick links
  getQuickLinks(renderQuickLinks);

  // Save button
  document.getElementById('save-btn').addEventListener('click', () => {
    const title = titleInput.value.trim();
    const company = companyInput.value.trim();
    const jobUrl = urlInput.value.trim();
    const status = document.getElementById('status').value;

    if (!title || !company) {
      let err = document.querySelector('.error-msg');
      if (!err) {
        err = document.createElement('p');
        err.className = 'error-msg';
        document.getElementById('form-container').insertBefore(err, document.getElementById('save-btn'));
      }
      err.textContent = 'Title and company are required';
      return;
    }

    const now = new Date().toISOString();
    const newJob = {
      id: generateId(),
      title,
      company,
      url: jobUrl,
      description: tabInfo.extractedDescription || null,
      status,
      fitScore: null,
      fitReasoning: '',
      notes: '',
      salary: null,
      contacts: [],
      activityLog: [{ action: 'Job saved from extension', timestamp: now }],
      followUpDate: null,
      dateAdded: now,
      dateApplied: status === 'applied' ? now : null,
      recruiterOutreach: null,
      weekApplied: status === 'applied' ? getWeekKey() : null,
    };

    getChromeJobs((jobs) => {
      const updated = [newJob, ...jobs];
      saveToChromeStorage(updated);

      document.getElementById('success-company').textContent = `${title} at ${company}`;
      show('success');
    });
  });
});
